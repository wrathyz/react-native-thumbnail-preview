import {VttType} from './Vtt';

type CacheImageVttData = {
  uri: string,
  path?: string,
  width: number,
  height: number,
};

class CacheStatic {
  rnFetchBlob: any;
  vtt: {[key: string]: VttType[]} = {};
  images: {[key: string]: CacheImageVttData} = {};

  initRNFetchBlob = (rnFetchBlob: any) => {
    this.rnFetchBlob = rnFetchBlob;
  };

  storeVtt = (key: string, data: any[]) => {
    this.vtt[encodeURIComponent(key)] = data;
    return true;
  };

  getVtt = (key: string): VttType[] => {
    return this.vtt[encodeURIComponent(key)];
  };

  storeImage = (key: string | undefined, width: number, height: number) => {
    if (
      !this.rnFetchBlob ||
      typeof key !== 'string' ||
      typeof width !== 'number' ||
      typeof height !== 'number'
    )
      return;

    this.images[encodeURIComponent(key)] = {
      uri: key,
      width,
      height,
    };

    this.rnFetchBlob
      .config({
        fileCache: true,
        appendExt: 'jpg',
      })
      .fetch('GET', key)
      .then((res: any) => {
        /**
         * When take a long time to load image but index is removed
         */
        if (!this.images[encodeURIComponent(key)]) {
          res.flush();
          return;
        }

        this.images[encodeURIComponent(key)].path = res.path();
      })
      .catch(() => {});
  };

  getImage = (key: string | undefined) => {
    return !!key ? this.images[encodeURIComponent(key)] : null;
  };

  clearImage = () => {
    for (let key in this.images) {
      this.rnFetchBlob?.fs?.unlink?.(this.images[key]?.path);
    }
    this.images = {};
  };
}

const Cache = new CacheStatic();

export {Cache};
