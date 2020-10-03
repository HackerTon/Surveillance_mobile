import firestore from '@react-native-firebase/firestore';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Buffer} from 'buffer';
import moment from 'moment';
import React, {useEffect, useState} from 'react';
import {Alert, StatusBar, Text, View} from 'react-native';
import {Button, ListItem, ThemeProvider} from 'react-native-elements';
import {FlatList} from 'react-native-gesture-handler';
import * as Mqtt from 'react-native-native-mqtt';
import {Notification, Notifications} from 'react-native-notifications';

const theme = {
  Button: {
    containerStyle: {borderColor: 'grey', borderWidth: 1},
    titleStyle: {color: 'white'},
    type: 'clear',
  },
};

const Msg = {
  name: 'Msg',
  properties: {
    timecode: 'int',
    msg: 'string',
  },
};

const Stack = createStackNavigator();
const client = new Mqtt.Client('tcp://appservers.ddns.net:1883');

function encode_mqtt(value: string) {
  return Buffer.from(value);
}

const Expander = (props: any) => {
  const {objects, ListFooterComponent} = props;

  if (objects == null) {
    return <Text>loading</Text>;
  }

  const style = {color: 'white', fontSize: 20};
  const keyExtractor = (_, index) => index.toString();
  const renderItem = ({item}) => (
    <ListItem
      containerStyle={{
        backgroundColor: '#191919',
        margin: 10,
        borderWidth: 2,
        borderColor: 'white',
      }}>
      <ListItem.Content>
        <ListItem.Title style={style}>{item.msg}</ListItem.Title>
        <ListItem.Subtitle style={style}>
          {moment(item.timecode).format('llll')}
        </ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  );

  const EmptyList = () => {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{color: 'white', fontSize: 25, fontWeight: 'bold'}}>
          No notification
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      keyExtractor={keyExtractor}
      data={objects}
      renderItem={renderItem}
      ListEmptyComponent={EmptyList}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={{minHeight: '100%'}}
    />
  );
};

const Home = () => {
  const [data, setData] = useState([]);

  // Initialize Mqtt Client
  useEffect(() => {
    InsertData();
    AddFireListeners();

    client.connect(
      {
        clientId: client.id,
        username: 'hackerton',
        password: 'hackerton',
        autoReconnect: true,
      },
      (error) => {
        console.log(`MQTT Connect: ${error}`);
      },
    );

    console.log(client);

    client.on(Mqtt.Event.Error, (error) => {
      console.log('MQTT Error Event:', error);
    });

    // return function cleanup() {
    //   console.log('Cleanup');
    //   client.disconnect();
    // };
  }, []);

  const InsertData = () => {
    firestore()
      .collection('notification')
      .orderBy('timecode', 'desc')
      .get()
      .then((snapshot) => {
        let array = [];

        snapshot.forEach((document) => {
          array.push(document.data());
        });

        setData([...array]);
      });
  };

  const AddFireListeners = () => {
    firestore()
      .collection('notification')
      .onSnapshot((snapshot) => {
        InsertData();
      });
  };

  const ClearHistory = () => {
    firestore()
      .collection('notification')
      .get()
      .then((snapshot) => {
        snapshot.forEach((document) => document.ref.delete());
      });
  };

  const OnSecurity = () => {
    client.publish('prodnotif/1', Buffer.from('O'), 2);
    Alert.alert('Security ON');
  };

  const OffSecurity = () => {
    client.publish('prodnotif/1', Buffer.from('F'), 2);
    Alert.alert('Security OFF');
  };

  const list_item = data ? data : null;
  return (
    <>
      <View style={{flex: 1, backgroundColor: '#191919'}}>
        <Expander objects={list_item} />
      </View>
      <View
        style={{
          flex: 0,
          flexDirection: 'row',
          backgroundColor: '#191919',
          justifyContent: 'space-around',
        }}>
        <Button
          containerStyle={{margin: 15}}
          title="Clear Notification"
          onPress={ClearHistory}
        />
        <Button containerStyle={{margin: 15}} title="ON" onPress={OnSecurity} />
        <Button
          containerStyle={{margin: 15}}
          title="OFF"
          onPress={OffSecurity}
        />
      </View>
    </>
  );
};

function App() {
  const [route, setRoute] = useState('Register');

  // initialization for react native notification
  useEffect(() => {
    Notifications.registerRemoteNotifications();

    Notifications.events().registerRemoteNotificationsRegistered((event) => {
      // store token in firestore
      const collection = firestore().collection('users');
      collection
        .doc(event.deviceToken)
        .set({token: event.deviceToken})
        .then(() => {
          console.log('Registered with FCM');
        })
        .catch((err) => {
          console.log('Notification Registration Error: ', err);
        });
    });

    Notifications.events().registerNotificationReceivedForeground(
      (notification: Notification, completion) => {
        console.log('Notification received');
        completion({alert: true, sound: false, badge: false});
      },
    );

    Notifications.events().registerNotificationOpened(
      (Notification: Notification, completion) => {
        console.log('Notificated received when on');
        completion();
      },
    );
  }, []);

  const LeftHeader = () => (
    <Text style={{color: 'white', fontSize: 20, fontWeight: 'bold'}}>
      Farmzer
    </Text>
  );

  return (
    <ThemeProvider theme={theme}>
      <NavigationContainer>
        <StatusBar backgroundColor="black" />
        <Stack.Navigator
          initialRouteName={route}
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0D0D0D',
            },
            headerTitleStyle: {
              color: 'white',
            },
            headerTitle: LeftHeader,
          }}>
          <Stack.Screen name="Home" component={Home} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

export default App;
