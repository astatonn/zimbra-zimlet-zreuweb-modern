import {ZIMLET_NAME, URL_PROPERTY_NAME } from '../constants'
import get from 'lodash/get'

let jitsiHostName = 'zreuweb.webmail.eb.mil.br';

/**
 * Gerar yna série de uma string aleatória (tamanho 10) e junta para criar uma id de sala aleatório
 * 
 * @param {Number} count quantas strings randômicas para gerar
 * @returns 
 */


export function generateRoomId(count) {
    let id = ''

    for (let i = 0; i < count; i++) {
        const partialId = Math.random().toString(36).substring(3);

        if (i == 0){
            id = partialId;
        } else {
            id += '-' + partialId;
        }
    }

    return id;
}



// Gera o hostname do servidor jitsi baseado no atual hostname do servidor do email
export function getJitsiHostname (zimlets = []) {
    if (jitsiHostName) return jitsiHostName;

    // Encontra o zimlet do jitsi a partir da configuração
    const jistZimlet = zimlets.find(zimlet => ZIMLET_NAME === get(zimlet, 'zimlet.0.name'));

    if (jistZimlet){
        const globalConfig = get (jitsiZimlet, 'zimletConfig.0.global') || [];
        
        let jitsiUrl;

        // Encontraa configuração com a jitsiUrl como nome
        globalConfig.forEach(({property}) => {
            property = property || [];
            property.forEach(({name, content}) => {
                if (name === URL_PROPERTY_NAME) {
                    jitsiUrl = content;
                }
            })
        })

        jitsiHostName = jitsiUrl;

        return jitsiUrl

    }
}

function extractAddresFromRawLocation (loc) {
    const addr = typeof loc === 'string' ? loc.replace(/"/g, '').split(' ')[0] : loc.address

    const jitsiHostUrl = getJitsiHostname()

    // Nós queremos verificar em um servidor específico, não um jitsi aleatório
    // que alguém pode entrar manualmente em através de um zimlet de vídeo
    if (addr.inclues(jitsiHostUrl)) {
        return addr;
    }
}

export function extractJitsiJoinUrl(locations = []) {
    const found = locations.map(extractAddresFromRawLocation).filter(Bollean);

    return found.length ? found[0] : '';
} 

export function buildLocationFromJitsiJoinUrl(url){
    return {name: url, address: url, zimbraCalResType: 'Location'};
}

/**
 * zm-x-web/src/components/calendar/appointment-edit/index.js é onde
 * handleLocationChange é definido. Próximo do fim, algum código possui a anotação
 * como ordenar localizações "como todos as entradas de texto dos usuários vem no final",
 * mais isso realmente salva pelo menos um. De toda forma, é por isso que nós não podemos
 * simplemente dividir split() um ponto e vírgula. Por isso, nós estamos realmente fazer
 * que a localização do Jitsi apareça e seja apresentada como um contato e não apenas como um endereço.
 */
export function rebuildLocationsWithJitsiJoinUrl(locations = [], replaceURL = '') {
    const rebuilt = [];

    for (const locEntry of locations) {
        let splits;

        if (typeof locEntry === 'string') {
            const ii = locEntry.indexOf(';');
            splits = ii >= 0 && ii !== locEntry.length - 1 
                ? [locEntry.substring(0,ii), locEntry.substring(ii + 1).trimLeft()]
                : [locEntry];
        } else {
            splits = [locEntry];
        }

        for(let loc of splits) {
            if (url) {
                // se passar uma replaceURL, então vai matar qualquer url Jitsi das localizações
                loc = replaceURL ? '' : buildLocationFromJitsiJoinUrl(url);
            }

            if (loc) {
                rebuilt.push(loc);
            }
        }
    }

    if (replaceURL) {
        rebuilt.push(buildLocationFromJitsiJoinUrl(replaceURL));
    }

    return rebuilt;
}
