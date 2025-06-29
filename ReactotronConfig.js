// ReactotronConfig.js
import Reactotron from 'reactotron-react-native';

Reactotron
  .configure() // אפשר גם לשים host: 'YOUR_IP' אם אתה ב-Android physical device
  .useReactNative()
  .connect();

console.tron = Reactotron;
