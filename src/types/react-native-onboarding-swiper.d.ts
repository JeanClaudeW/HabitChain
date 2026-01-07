declare module 'react-native-onboarding-swiper' {
  import { Component } from 'react';
  import { ViewStyle, TextStyle, ImageSourcePropType } from 'react-native';

  interface Page {
    backgroundColor: string;
    image?: React.ReactNode;
    title: React.ReactNode;
    subtitle: React.ReactNode;
  }

  interface Props {
    pages: Page[];
    onDone?: () => void;
    onSkip?: () => void;
    // Add more props if you use them (showSkip, skipLabel, etc.)
  }

  export default class Onboarding extends Component<Props> {}
}
