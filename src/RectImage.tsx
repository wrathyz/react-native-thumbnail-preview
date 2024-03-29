import React, {Component} from 'react';
import {
  View,
  ImageBackground,
  StyleProp,
  ViewStyle,
  ImageBackgroundProps,
  Platform,
  StyleSheet,
} from 'react-native';
import ImageSize from 'react-native-image-size';
import {Cache} from './Cache';

const DefaultProps = {
  style: {},
  baseMaxWidth: 100,
  baseMaxHeight: 100,
};

type Position = {
  x: number;
  y: number;
};

type RectImageProps = {
  style?: StyleProp<ViewStyle>;
  baseMaxWidth?: number;
  baseMaxHeight?: number;
  tiledDisplay: Position | number;
  source: {uri: string};
  children?: React.ReactNode | null;
};

class RectImage extends Component<RectImageProps> {
  static defaultProps = DefaultProps;
  state = {
    imagePath: '',
    isLoadImage: true,
    isImageOk: false,
    imageWidth: 1,
    imageHeight: 1,
    tileCol: 1,
    tileRow: 1,
    tileWidth: 1,
    tileHeight: 1,
  };
  isMount = false;

  UNSAFE_componentWillMount() {
    this.isMount = true;
  }

  componentDidMount() {
    this._loadImageResource(this.props.source?.uri);
  }

  UNSAFE_componentWillReceiveProps(np: RectImageProps) {
    if (
      this._getUrlData(this.props.source?.uri)?.imageUrl !==
      this._getUrlData(np.source?.uri)?.imageUrl
    ) {
      this._loadImageResource(np.source?.uri);
    }
  }

  componentWillUnmount() {
    this.isMount = false;
  }

  _loadImageResource = (url: string | undefined) => {
    if (!url) return;

    this.setState({isLoadImage: true}, () => {
      const urlData = this._getUrlData(url);
      const cacheImage = Cache.getImage(urlData?.imageUrl);

      if (!!cacheImage?.path) {
        const imagePath = !!cacheImage?.path
          ? (Platform.OS === 'android' ? 'file://' : '') + cacheImage.path
          : urlData?.imageUrl;
        this._setImageResource(url, cacheImage.width, cacheImage.height, {
          imagePath,
          isLoadImage: false,
          isImageOk: true,
        });
      } else {
        ImageSize.getSize(urlData?.imageUrl || '')
          .then(async ({width, height}) => {
            Cache.storeImage(urlData?.imageUrl, width, height);
            if (this.isMount) {
              this._setImageResource(url, width, height, {
                imagePath: urlData?.imageUrl,
                isLoadImage: false,
                isImageOk: true,
              });
            }
          })
          .catch(
            () =>
              this.isMount &&
              this.setState({
                isImageOk: false,
                isLoadImage: false,
              }),
          );
      }
    });
  };

  _setImageResource = (
    url: string,
    width: number,
    height: number,
    state: {[key: string]: any},
  ) => {
    const urlData = this._getUrlData(url);

    const tileWidth = urlData?.width || 0;
    const tileHeight = urlData?.height || 0;
    const tileCol = width / tileWidth;
    const tileRow = height / tileHeight;

    this.setState({
      ...state,
      tileCol,
      tileRow,
      imageWidth: width,
      imageHeight: height,
      tileWidth,
      tileHeight,
    });
  };

  _getTiledDisplay = () => {
    const {tiledDisplay} = this.props;
    let {tileCol, tileRow} = this.state;
    let dis = tiledDisplay;

    if (typeof dis == 'number') {
      let x = tileCol === 1 ? 0 : dis % tileCol;
      let y = tileRow === 1 ? 0 : ~~(dis / tileRow);
      dis = {x, y};
    }

    return dis;
  };

  _getSizeViewFromTile = (tileWidth: number, tileHeight: number) => {
    const {baseMaxWidth, baseMaxHeight} = this.props;

    /**
     * select width or hight for max base of view
     * - width > height means landscape video
     * - height > width means protrait video
     */
    let widthView = baseMaxWidth || 0;
    let heightView = baseMaxHeight || 0;
    if (tileWidth > tileHeight) {
      let ratioHeight = tileHeight / tileWidth;
      heightView = (baseMaxWidth || 0) * ratioHeight;
    } else {
      let ratioWidth = tileWidth / tileHeight;
      widthView = (baseMaxHeight || 0) * ratioWidth;
    }

    return {
      widthView,
      heightView,
    };
  };

  _getSizeView = () => {
    const {source} = this.props;
    let {tileWidth, tileHeight, imageWidth, imageHeight} = this.state;
    const urlData = this._getUrlData(source.uri);

    const sizeView = this._getSizeViewFromTile(
      tileWidth > 1 ? tileWidth : urlData?.width || 0,
      tileHeight > 1 ? tileHeight : urlData?.height || 0,
    );

    let size = {
      widthView: sizeView.widthView,
      heightView: sizeView.heightView,
      widthImage: (sizeView.widthView / tileWidth) * imageWidth,
      heightImage: (sizeView.heightView / tileHeight) * imageHeight,
    };

    return size;
  };

  _getUrlData = (url: string) => {
    try {
      const sourceAndxywh = url.split('#xywh=');
      const xywh = sourceAndxywh[1].split(',').map(v => Number(v));

      return {
        // full url
        url,
        // not include #xywh=
        imageUrl: sourceAndxywh[0],
        x: xywh[0],
        y: xywh[1],
        width: xywh[2],
        height: xywh[3],
      };
    } catch (e) {
      return null;
    }
  };

  render() {
    const {style, source, children} = this.props;
    let {imagePath, isLoadImage, isImageOk} = this.state;

    if (!isImageOk || !source.uri) return null;

    const display = this._getTiledDisplay();
    const size = this._getSizeView();
    const imageProps: ImageBackgroundProps = {
      style: {
        ...StyleSheet.flatten(style || {}),
        width: size.widthView,
        height: size.heightView,
        overflow: 'hidden',
      },
      imageStyle: {
        width: size.widthImage,
        height: size.heightImage,
        transform: [
          {
            translateX: size.widthView * -display.x,
          },
          {
            translateY: size.heightView * -display.y,
          },
        ],
      },
      resizeMethod: 'resize',
      source: {uri: imagePath},
    };

    if (isLoadImage) return this._renderLoadingImage(imageProps.style);

    return <ImageBackground {...imageProps}>{children}</ImageBackground>;
  }

  _renderLoadingImage = (style: StyleProp<ViewStyle>) => {
    return <View style={style}>{this.props.children}</View>;
  };
}

export {RectImage};
