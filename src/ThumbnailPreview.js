import React, {ReactNode, useEffect, useState} from 'react';
import {View} from 'react-native';
import {Cache} from './Cache';
import {Vtt, VttType} from './Vtt';
import {RectImage} from './RectImage';

export type ThumbnailPreviewProps = {
  /** url vtt of video */
  vttUrl: string,
  /** currentTime to display thumbnail */
  currentSecond: number,
  /**
   * if url image in vtt file has only path like this "1.png",
   * you can set baseUrl here, it will be baseUrl + "1.png"
   * */
  baseUrl?: string,
  baseMaxWidth?: number,
  baseMaxHeight?: number,
  children?: ReactNode,
};

const ThumbnailPreview = (props: ThumbnailPreviewProps) => {
  const [vttData, setVttData] = useState([]);

  useEffect(() => {
    const res = Cache.getVtt(props.vttUrl);
    if (!!res?.length) {
      setVttData(res);
    } else {
      Vtt.fetchVttData(props.vttUrl).then((res) => {
        if (!!res?.length) {
          setVttData(res);
          Cache.storeVtt(props.vttUrl, res);
        }
      });
    }
  }, [props.vttUrl]);

  const resource = Vtt.getResourcePreview(
    props?.currentSecond,
    vttData,
  );
  const url = !!props?.baseUrl
    ? props?.baseUrl + resource?.source?.uri
    : resource?.source?.uri;

  return !!vttData?.length && !!resource && typeof url === 'string' ? (
    <RectImage
      source={{uri: url}}
      tiledDisplay={resource.tiledDisplay}
      baseMaxWidth={props?.baseMaxWidth}
      baseMaxHeight={props?.baseMaxHeight}>
      {props.children}
    </RectImage>
  ) : (
    <View />
  );
};

export {ThumbnailPreview};
