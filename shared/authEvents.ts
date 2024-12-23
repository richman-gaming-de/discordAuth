export const AuthEvents = {
    toServer: {
        login: 'auth:event:login',
        register: 'auth:event:register',
        hasAuthenticated: 'server:event:finish:authenticate',
        incomingConnection: 'auth:event:playerConnect'
    },
    toClient: {
        remember: 'auth:event:remember',
        cameraCreate: 'auth:event:camera:create',
        cameraDestroy: 'auth:event:camera:destroy',
        authenticate: 'client:event:authenticate'
    },
    fromServer: {
        invalidLogin: 'auth:event:invalid:login',
        invalidRegister: 'auth:event:invalid:register',
        userAgreementComplete: 'user-agreement-complete'
    },
    fromClient: {
        connectionComplete: 'connectionComplete'
    }
}