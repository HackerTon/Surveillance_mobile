import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Buffer} from 'buffer';
import React, {useEffect, useState} from 'react';
import {Keyboard, StatusBar, Text, View} from 'react-native';
import {Button, ListItem, ThemeProvider} from 'react-native-elements';
import {FlatList, ScrollView} from 'react-native-gesture-handler';
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
  const {objects, ListFooterComponent} = props;

  if (objects == null) {
    return <Text>loading</Text>;
  }

  const style = {color: 'white', fontSize: 20};

  const keyExtractor = (item, index) => index.toString();

  const renderItem = ({item}) => (
    <ListItem bottomDivider containerStyle={{backgroundColor: '#191919'}}>
      <ListItem.Content>
        <ListItem.Title style={style}>{item.msg}</ListItem.Title>
        <ListItem.Subtitle style={style}>
          {moment(item.timecode).format('llll')}
        </ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  );

  const EmptyList = ({}) => {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{color: 'white', fontSize: 20, fontWeight: 'bold'}}>
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
  const [realdb, setRealdb] = useState();
  const [data, setData] = useState([]);

  // Initialize Mqtt Client
  useEffect(() => {
    console.log('RENDER EFFECT');
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
          // autoReconnect: true,
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
        client.subscribe(['esptest/1'], [2]);
      });

      client.on(Mqtt.Event.Message, (topic, message) => {
        console.log(`Received packet ${topic}`);
        if (topic === 'esptest/1') {
          realm.write(() => {
            const pack = {
              timecode: Date.now(),
              msg: message.toString(),
            };
            realm.create('Msg', pack);
            setData([...realm.objects('Msg')].reverse());
            Notificator.notify(pack);
          });
        }
      });
    });

    return function cleanup() {
      console.log('Cleanup');
      client.disconnect();
    };
  }, []);

  const ClearHistory = () => {
    realdb!.write(() => {
      realdb!.deleteAll();
      setData([...realdb.objects('Msg')]);
    });
  };

  const list_item = realdb ? data : null;

  return (
    <View style={{backgroundColor: '#191919'}}>
      <Expander
        objects={list_item}
        ListFooterComponent={
          <View style={{flex: 1, flexDirection: 'row'}}>
            <Button title="Empty Button" />
            <Button title="Clear Notification" onPress={ClearHistory} />
          </View>
        }
      />
    </View>
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
  const [route, setRoute] = useState('Home');

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
