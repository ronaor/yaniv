/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import Sound from 'react-native-sound';

Sound.setCategory('Playback', true);

AppRegistry.registerComponent(appName, () => App);
