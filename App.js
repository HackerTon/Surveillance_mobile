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
import {Text, View, Button} from 'react-native';
import * as Mqtt from 'react-native-native-mqtt';
import Realm from 'realm';
import {Buffer} from 'buffer';

const Stack = createStackNavigator();

function encode_mqtt(value) {
  return Buffer.from(value);
}

const Home = ({route, navigation}) => {
  const [records, setRecords] = useState([]);
  const [client, setClient] = useState(
    new Mqtt.Client('tcp://broker.hivemq.com:1883'),
  );

  console.log('Refresh');

  // useEffect(() => {
  //   Realm.open({
  //     schema: [{name: 'Msgs', properties: {timecode: 'string', msg: 'string'}}],
  //   }).then((realm) => {
  //     realm.write(() => {
  //       realm.create('Msgs', {timecode: 'hllo', msg: 'msgs'});
  //     });
  //     console.log(realm.objects('Msgs').length);
  //   });
  // });

  // Initialize Mqtt Client
  useEffect(() => {
    try {
      client.connect(
        {
          clientId: 'PHONE',
          username: 'hackerton',
          password: 'hackerton',
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
  }, []);

  // Update array if topic is found
  useEffect(() => {
    client.on(Mqtt.Event.Message, (topic, message) => {
      console.log(message.toString());
      if (topic === 'esptest/1') {
        setRecords([
          ...records,
          {timecode: Date.now(), msg: message.toString()},
        ]);
      } else if (topic === 'esptest/2') {
        console.log(message.toString());
      }
    });
  }, [records]);

  return (
    <View>
      {records.map(({timecode, msg}) => {
        return <Text>{msg}</Text>;
      })}
      <Button
        title={'STRING'}
        onPress={() => {
          client.publish(
            'esptest/2',
            encode_mqtt(JSON.stringify({name: 'alan'})),
          );
        }}>
        Button
      </Button>
    </View>
  );
};

function Register({navigation}) {
  return (
    <View>
      <Text>Register</Text>
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
