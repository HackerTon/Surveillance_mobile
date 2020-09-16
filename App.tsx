/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Buffer} from 'buffer';
import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';
import {Button} from 'react-native-elements';
import {ListItem} from 'react-native-elements';
import {ScrollView} from 'react-native-gesture-handler';
import * as Mqtt from 'react-native-native-mqtt';
import Realm, {List} from 'realm';
import Notificator from './notification';

const Msg = {
  name: 'Msg',
  properties: {
    timecode: 'int',
    msg: 'string',
  },
};

const Stack = createStackNavigator();

function encode_mqtt(value: string) {
  return Buffer.from(value);
}

const Expander = (props: any) => {
  const objects: List<any> = props.objects;

  if (objects == null) {
    return <Text>loading</Text>;
  }

  return (
    <View>
      {objects.map((value) => {
        const {timecode, msg} = value;

        const time_text = new Date(timecode).toLocaleTimeString('en-US');

        return (
          <ListItem style={{paddingBottom: 5}} key={timecode} bottomDivider>
            <ListItem.Content>
              <ListItem.Title>{msg}</ListItem.Title>
              <ListItem.Subtitle>{time_text}</ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>
        );
      })}
    </View>
  );
};

const Home = ({route, navigation}) => {
  const [client, _] = useState(new Mqtt.Client('tcp://broker.hivemq.com:1883'));

  const [realdb, setRealdb] = useState();
  const [data, setData] = useState([]);

  // Initialize Mqtt Client
  useEffect(() => {
    var db = null;

    Realm.open({
      schema: [Msg],
    }).then((realm) => {
      db = realm;
      setRealdb(realm);

      setData(realm.objects('Msg'));
    });

    try {
      client.connect(
        {
          clientId: `${Math.floor(Math.random() * 1000)}_PHONE`,
          username: 'hackerton',
          password: 'hackerton',
          autoReconnect: true,
        },
        (err) => {},
      );
    } catch (error) {}

    client.on(Mqtt.Event.Error, (error) => {
      console.log('Error Message:', error);
    });

    client.on(Mqtt.Event.Connect, () => {
      console.log('Mqtt Connect');
      client.subscribe(['esptest/1'], [0]);
    });

    client.on(Mqtt.Event.Message, (topic, message) => {
      console.log(`Received packet ${topic}`);
      if (topic === 'esptest/1') {
        try {
          const pack = {
            timecode: Date.now(),
            msg: message.toString(),
          };

          db.write(() => {
            db.create('Msg', pack);
          });

          setData([...db.objects('Msg')]);
          Notificator.notify(pack);
        } catch (e) {
          console.log(`Error on creation ${e}`);
        }
      }
    });
  }, []);

  const list_item = realdb ? data : null;

  let style = {width: '50%', paddingVertical: 10};

  return (
    <ScrollView>
      <View style={{flex: 1, flexDirection: 'row'}}>
        <Button
          containerStyle={{...style, paddingLeft: 10}}
          title="Empty Button"
        />
        <Button
          containerStyle={{...style, paddingHorizontal: 10}}
          title="Clear Notification"
          onPress={() =>
            realdb.write(() => {
              realdb.deleteAll();
              setData([...realdb.objects('Msg')]);
            })
          }
        />
      </View>
      <Expander objects={list_item} />
    </ScrollView>
  );
};

function Register({navigation}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('MOUNT ' + count);
    setCount(1);
  }, []);

  console.log('count' + count);

  return (
    <View>
      <Text>{count}</Text>
      <Button title="Count Increment" onPress={() => setCount(count + 1)} />
    </View>
  );
}

function App() {
  const [route, setRoute] = useState('Home');

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={route}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Register" component={Register} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
