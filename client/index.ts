import * as alt from 'alt-client'
import * as native from 'natives'
import { AuthEvents } from '../shared/authEvents.js'

const CamPos = {
    x: -842.0626220703125,
    y: -79.3422622680664,
    z: 37.16979293823241
}

const CamRot = {
    x: 0,
    y: 0,
    z: 30
}

async function handleAuthentication(discordAppId: string) {
    let bearerToken: string

    createCamera()

    try {
        bearerToken = await alt.Discord.requestOAuth2Token(discordAppId)
    } catch (e) {
        throw e
    }

    alt.emitServerRaw(AuthEvents.toServer.hasAuthenticated, bearerToken)
}

let camera: number

function createCamera() {
    alt.log("createCamera")
    if (typeof camera !== 'undefined') {
        return
    }

    camera = native.createCamWithParams(
        'DEFAULT_SCRIPTED_CAMERA',
        CamPos.x,
        CamPos.y,
        CamPos.z,
        CamRot.x,
        CamRot.y,
        CamRot.z,
        55,
        false,
        1
    )

    native.setCamFov(camera, 80)
    native.setCamActive(camera, true)
    native.renderScriptCams(true, true, 1000, false, false, 0)
    native.displayRadar(false)
    alt.toggleGameControls(false)

    alt.log('Camera created and natives set')
}

function destroyCamera() {
    if (typeof camera === 'undefined') {
        return
    }

    native.destroyAllCams(true)
    native.setCamActive(camera, false)
    native.renderScriptCams(false, false, 0, false, false, 0)
    native.displayRadar(true)
    alt.toggleGameControls(true)
}

alt.on(AuthEvents.fromClient.connectionComplete, () => {
    alt.emitServer(AuthEvents.toServer.incomingConnection)
})
alt.onServer(AuthEvents.toClient.authenticate, handleAuthentication)
alt.onServer(AuthEvents.toClient.cameraDestroy, destroyCamera)
