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
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
} from 'react-native';
import * as Mqtt from 'react-native-native-mqtt';

const Stack = createStackNavigator();

const Home = ({route, navigation}) => {
  const [records, setRecords] = useState([]);
  const [client, setClient] = useState(
    new Mqtt.Client('tcp://broker.hivemq.com:1883'),
  );

  useEffect(() => {
    client.on(Mqtt.Event.Error, (error) => {
      console.error('Error Message:', error);
    });

    client.on(Mqtt.Event.Connect, () => {
      console.log('Mqtt Connect');
      client.subscribe(['esptest/1'], [0]);
    });

    client.connect(
      {
        clientId: 'PHONE',
        username: 'hackerton',
        password: 'hackerton',
      },
      (err) => {
        console.log(err);
      },
    );

    return () => client.disconnect();
  }, []);

  useEffect(() => {
    client.on(Mqtt.Event.Message, (topic, message) => {
      console.log('Mqtt Message:', topic, message.toString());
      setRecords([...records, {timecode: Date.now(), msg: message.toString()}]);
    });
  }, [records]);

  return (
    <View>
      {records.map(({timecode, msg}) => {
        console.log(timecode);
        return (
          <View>
            <Text>Timecode: {timecode}</Text>
            <Text>Msg: {msg}</Text>
          </View>
        );
      })}
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
  const [route, setRoute] = useState('home');

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
