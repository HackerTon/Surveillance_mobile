/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import React, {useEffect, useState} from 'react';
import {Text, View, Button, StatusBar} from 'react-native';
import * as Mqtt from 'react-native-native-mqtt';
import Realm, {List} from 'realm';
import {Buffer} from 'buffer';
import {ListItem} from 'react-native-elements';
import {ScrollView} from 'react-native-gesture-handler';

const Msg = {
  name: 'Msg',
  properties: {
    timecode: 'string',
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

        return (
          <ListItem key={timecode} bottomDivider>
            <ListItem.Content>
              <ListItem.Title>{msg}</ListItem.Title>
              <ListItem.Subtitle>{timecode}</ListItem.Subtitle>
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
          clientId: 'PHONE',
          username: 'hackerton',
          password: 'hackerton',
          autoReconnect: true,
        },
        (err) => {},
      );
    } catch (error) {}

    client.on(Mqtt.Event.Error, (error) => {
      console.error('Error Message:', error);
      alert(`Error message ${error}`);
    });

    client.on(Mqtt.Event.Connect, () => {
      console.log('Mqtt Connect');
      client.subscribe(['esptest/1'], [0]);
    });

    client.on(Mqtt.Event.Message, (topic, message) => {
      if (topic === 'esptest/1') {
        try {
          const pack = {
            timecode: new Date().toLocaleString('en-US'),
            msg: message.toString(),
          };

          db.write(() => {
            db.create('Msg', pack);
          });
          setData([...db.objects('Msg')]);
        } catch (e) {
          console.log(`Error on creation ${e}`);
        }
      }
    });
  }, []);

  const list_item = realdb ? data : null;

  return (
    <View>
      <ScrollView>
        <Expander objects={list_item} />
        <Button
          title="WRITE MQTT"
          onPress={() => {
            client.publish(
              'esptest/2',
              encode_mqtt(JSON.stringify({name: 'alan'})),
            );
          }}
        />
        <Button
          title="WRITE DB"
          onPress={() => write(Date.now().toString(), 'message')}
        />
      </ScrollView>
    </View>
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
