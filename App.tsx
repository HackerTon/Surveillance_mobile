import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Buffer} from 'buffer';
import React, {useEffect, useState} from 'react';
import {StatusBar, Text, View} from 'react-native';
import {Button, ListItem, ThemeProvider} from 'react-native-elements';
import {ScrollView} from 'react-native-gesture-handler';
import * as Mqtt from 'react-native-native-mqtt';
import Realm, {List} from 'realm';
import Notificator from './notification';
import moment from 'moment';

const theme = {
  Button: {
    containerStyle: {width: 200, borderColor: 'grey', borderWidth: 1},
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
const client = new Mqtt.Client('tcp://broker.hivemq.com:1883');

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

        const time_text = moment(timecode).format('lll')

        const style = {
          'border-radius': 10,
          // display: 'inline-block',
          paddingBottom: 10,
          'box-shadow':
            '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
        };

        return (
          <ListItem style={style} key={timecode} bottomDivider>
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

const Home = () => {
  const [realdb, setRealdb] = useState();
  const [data, setData] = useState([]);

  // Initialize Mqtt Client
  useEffect(() => {
    Realm.open({
      schema: [Msg],
    }).then((realm) => {
      setRealdb(realm);
      setData(realm.objects('Msg'));

      client.connect(
        {
          clientId: `${Math.floor(Math.random() * 1000)}_PHONE`,
          username: 'hackerton',
          password: 'hackerton',
          autoReconnect: true,
        },
        (error) => {
          console.log(`MQTT Connect: ${error}`);
        },
      );

      client.on(Mqtt.Event.Error, (error) => {
        console.log('MQTT Error Event:', error);
      });

      client.on(Mqtt.Event.Connect, () => {
        console.log('MQTT Connect Event');
        client.subscribe(['esptest/1'], [0]);
      });

      client.on(Mqtt.Event.Message, (topic, message) => {
        console.log(`Received packet ${topic}`);
        if (topic === 'esptest/1') {
          realm.write(() => {
            realm.create('Msg', {
              timecode: Date.now(),
              msg: message.toString(),
            });
            setData(realm.objects('Msg'));
          });
        }
      });
    });
  }, []);

  const ClearHistory = () => {
    realdb!.write(() => {
      realdb!.deleteAll();
      setData([...realdb.objects('Msg')]);
    });
  };

  const list_item = realdb ? data : null;

  return (
    <ScrollView style={{backgroundColor: '#191919'}}>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
        }}>
        <View>
          <Button title="Empty Button" />
        </View>
        <View>
          <Button title="Clear Notification" onPress={ClearHistory} />
        </View>
      </View>
      <Expander objects={list_item} />
    </ScrollView>
  );
};

function Register({navigation}) {
  return (
    <View
      style={{
        backgroundColor: '#191919',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <View style={{padding: 10}}>
        <Text style={{fontSize: 20, color: 'white', fontWeight: 'bold'}}>
          HELLO THERE {moment().format('lll')}
        </Text>
      </View>
      <Button
        title="Count Increment"
        onPress={() => navigation.navigate('Home')}
      />
    </View>
  );
}

function App() {
  const [route, setRoute] = useState('Register');

  console.log('Render App');

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
          }}>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Register" component={Register} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

export default App;
