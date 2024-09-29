import { createElement, Component, render } from 'preact';
import { useSelector } from 'react-redux';
import { compose } from 'recompose';
import { withIntl } from '../../enhancers';
import { useState, useCallback, useMemo, useContext } from 'preact/hooks';
import { Text, IntlProvider, Localizer, IntlContext } from 'preact-i18n';

import style from './style';
import { Button } from '@zimbra-client/blocks';
import {useAccountInfo} from '@zimbra-client/hooks/graphql';

import isEqual from 'lodash/isEqual';
import get from 'lodash/get';

import {
   generateRoomId,
   getJitsiHostname, 
   extractJitsiJoinUrl,
   rebuildLocationsWithJitsiJoinUrl
} from '../../utils/jitsi-meeting'

const buttonInlineStyle = {
   backgroundColor: "#556b2f",
   color: "#FFFFFF",
}

function createMore({locations, handleLocationChange}) {
   const buttonIcon = (
      <span class={style.appIcon}>
      </span>);

   const {data} = useAccountInfo();
   const isOffline = useSelector(state => state.network.isOffline);

   const zimlets = get(data, 'accountInfo.zimlets.zimlet');

   const jitsiBaseUrl = "https://zreuweb.webmail.eb.mil.br";
   const rebuiltLocations = rebuildLocationsWithJitsiJoinUrl(locations);
   const extractedUrl = extractJitsiJoinUrl(rebuiltLocations);

   // Equilibrar a verificação baseada no nome da chave, desde que handleLocationChange sempre adicional chaves adicionais
   const equality = isEqual(
      locations
         .map (loc => (typeof loc === 'string' ? loc : loc.address))
         // Ignora os caracteres vazios da string que as vezes são exibidos, isso criar um array desigual
         .filter(loc => loc !== ''),
      rebuiltLocations.map(loc => (typeof loc === 'string' ? loc : loc.address))
   );

   if (rebuiltLocations.length > 0 && !equality) {
      handleLocationChange({
         value: rebuiltLocations
      });
   }

   // Cria um novo link do ZReuWeb caso ainda não esteja aparecendo, ou direciona o usuário para um link existente
   const handleClick = useCallback(() => {
      if (extractedUrl){
         window.open(extractedUrl, '_blank', 'noopener, noreferer')
         return;
      }
      const randomRoom = generateRoomId(3)
      const randomMeeting = `${jitsiBaseUrl}/${randomRoom}`

      handleLocationChange({
         value: rebuildLocationsWithJitsiJoinUrl(locations, randomMeeting)
      });
   }, [extractedUrl, jitsiBaseUrl, handleLocationChange, locations]);

   if (isOffline) return null;

   dispatch (
      setEvent({
         tabId: this.props.tabId,
         eventData: {
            notes: '\n\nVocê foi convidado para uma videoconferência no ZReu Web<\n><\n>Clique no ícone para se juntar à reunião',
            isFormDiry: true,
         }
      })
   )

   return jitsiBaseUrl ? (
      <Button
      class={style.button}
      onClick={handleClick}
      brand="primary"
      icon={buttonIcon}
      style = {buttonInlineStyle}
   >
      <Text id={`zimbra-zimlet-zreuweb-modern.${extractedUrl ? 'join' : 'make'}Button`} />
   </Button>
   ) : (
      <div>
         <Text id="zimbra-zimlet-zreuweb-modern.notSupported" />
      </div>
   )



}

//By using compose from recompose we can apply internationalization to our Zimlet
//https://blog.logrocket.com/using-recompose-to-write-clean-higher-order-components-3019a6daf44c/
export default compose(
   withIntl()
)
   (
      createMore
   )
