import * as alt from 'alt-server'
import { useRebar } from '@Server/index.js'
import { Account } from '@Shared/types/account.js'
import { AuthEvents } from '../shared/authEvents.js'
import { IDiscordUser } from '../interfaces/IDiscordUser.js'

const Rebar = useRebar()
const api = Rebar.useApi()

const db = Rebar.database.useDatabase()

const DISCORD_APP_ID = '0123456789010121314' //@ToDo: REMOVE! after fixing .env usage

const loginCallbacks: Array<(player: alt.Player) => void> = []

async function setAccount(player: alt.Player, discordUser: IDiscordUser) {
    alt.log(`Player ${discordUser.username} has logged in!`)

    let discord = discordUser.id
    let account = await db.get<Account>(
        { discord },
        Rebar.database.CollectionNames.Accounts
    )

    if (!account) {
        alt.log('Creating account for ' + discordUser.username)
        await db.create<Partial<Account>>(
            {
                discord: discordUser.id,
                ips: [player.ip],
                hardware: [
                    player.discordID,
                    player.socialID,
                    player.socialClubName,
                    player.hwidHash,
                    player.hwidExHash,
                    player.cloudID
                ],
                lastLogin: Date.now(),
                permissions: ['user'],
                banned: false,
                reason: '',
                email: discordUser.email
            },
            Rebar.database.CollectionNames.Accounts
        )

        account = await db.get<Account>(
            { discord },
            Rebar.database.CollectionNames.Accounts
        )
        if (!account) {
            throw new Error('Account creation failed')
        }
    }

    Rebar.document.account.useAccountBinder(player).bind(account)
    player.dimension = 0
    player.emit(AuthEvents.toClient.cameraDestroy)

    for (let cb of loginCallbacks) {
        cb(player)
    }
}

async function handleFinishAuthenticate(
    player: alt.Player,
    bearerToken: string
) {
    alt.Utils.waitFor(() => api.isReady('auth-api'), 30000)
    const rPlayer = Rebar.usePlayer(player)
    if (typeof bearerToken === 'undefined') {
        rPlayer.notify.showNotification(
            'Fehler bei der Verifizierung mit Discord. Bitte öffne Discord und versuche es erneut.'
        )
        player.emit(AuthEvents.toClient.authenticate)
        return
    }

    const request: Response = await fetch(
        'https://discordapp.com/api/users/@me',
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Bearer ${bearerToken}`
            }
        }
    ).catch((err) => {
        alt.log(err)
        return undefined
    })

    if (!request || request.status !== 200) {
        rPlayer.notify.showNotification(
            'Fehler bei der Verifizierung mit Discord. Bitte öffne Discord und versuche es erneut.'
        )
        player.emit(AuthEvents.toClient.authenticate)
        return
    }

    const data: undefined | IDiscordUser = await request.json()
    if (!data) {
        player.kick('Abfragen des Discord Benutzers fehlgeschlagen.')
        return
    }

    alt.log(`${data.username} has authenticated with discord!`)
    await setAccount(player, data)
}

async function handleConnect(player: alt.Player) {
    player.spawn(0, 0, 71)
    player.model = 'mp_m_freemode_01'
    player.dimension = 100000 + player.id

    player.emit(AuthEvents.toClient.authenticate, DISCORD_APP_ID)
}

alt.onClient(AuthEvents.toServer.incomingConnection, handleConnect)
alt.onClient(AuthEvents.toServer.hasAuthenticated, handleFinishAuthenticate)

export function useAuth() {
    function onLogin(callback: (player: alt.Player) => void) {
        loginCallbacks.push(callback)
    }

    return {
        onLogin
    }
}

declare global {
    export interface ServerPlugin {
        ['auth-api']: ReturnType<typeof useAuth>
    }
}

Rebar.useApi().register('auth-api', useAuth())
