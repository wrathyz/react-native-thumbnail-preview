import React from 'react';
import {View, Text} from 'react-native';

type PreviewDurationProps = {
  currentTimeSecond: number;
};

const PreviewDuration = (props: PreviewDurationProps) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}>
      <Text style={{color: '#fff', fontSize: 16}}>
        {String(~~(props.currentTimeSecond / 60) % 60).padStart(2, '0')}:
        {String(props.currentTimeSecond % 60).padStart(2, '0')}
      </Text>
    </View>
  );
};

export default PreviewDuration;
