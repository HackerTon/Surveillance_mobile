import {Platform} from 'react-native';
import PushNotification from 'react-native-push-notification';

class Notification {
  onAction() {
    console.log('Notification on action');
  }

  onNotification() {
    console.log('Notification logged');
  }

  onRegister(token: any) {
    console.log('Token', token);
  }

  notify({msg, timecode}) {
    const disp_msg = msg ? msg : 'null';
    const date = new Date(timecode);
    const disp_timecode = timecode ? date.toLocaleTimeString() : 'null';

    PushNotification.localNotification({
      autoCancel: true,
      bigText: disp_msg,
      subText: disp_timecode,
      title: 'Farmzer Alert',
      message: 'Expand me to see more',
      vibrate: true,
      vibration: 300,
      playSound: true,
      soundName: 'default',
      priority: 'high',
      importance: 'high',
    });
  }
}

const Notificator = new Notification();

PushNotification.configure({
  requestPermissions: Platform.OS === 'ios',
  onAction: Notificator.onAction.bind(Notificator),
  onNotification: Notificator.onNotification.bind(Notificator),
  onRegister: Notificator.onRegister.bind(Notificator),
});

export default Notificator;
