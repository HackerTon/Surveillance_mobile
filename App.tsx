import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Buffer} from 'buffer';
import moment from 'moment';
import React, {useEffect, useState} from 'react';
import {StatusBar, Text, View} from 'react-native';
import {Button, ListItem, ThemeProvider} from 'react-native-elements';
import {FlatList} from 'react-native-gesture-handler';
import * as Mqtt from 'react-native-native-mqtt';
import Realm from 'realm';
import Notificator from './notification';

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

  const EmptyList = ({}) => {
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
          clientId: client.id,
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
      </View>
    </>
  );
};

function App() {
  const [route, setRoute] = useState('Register');

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
