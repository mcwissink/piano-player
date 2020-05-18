// Function serves to blur an image so that at any size, the image is blurred just enough to not appear pixelly.
// If the target image size is smaller than or equal to the image, the image will not have blur.
export const calculateBlurByImageSize = ( imageSource: string, targetImageSize: number = document.documentElement.clientWidth): number => {
  // Guess work. Gaussian blur is beyond me.
  let image = new Image();
  image.src = imageSource;
  console.log(image.width + ' to ' + targetImageSize + " => The ratio:" + (targetImageSize/image.width));
  if ((targetImageSize / image.width) < 2) {
    return (targetImageSize / image.width ) - 1;
  }  
  return (targetImageSize / image.width );
}

// Maps keys to midi notes
export const keyMap: {[key: string]: number} = {
  "z": 48,
  "s": 49,
  "x": 50,
  "d": 51,
  "c": 52,
  "v": 53,
  "g": 54,
  "b": 55,
  "h": 56,
  "n": 57,
  "j": 58,
  "m": 59,
  "q": 60,
  "2": 61,
  "w": 62,
  "3": 63,
  "e": 64,
  "r": 65,
  "5": 66,
  "t": 67,
  "6": 68,
  "y": 69,
  "7": 70,
  "u": 71,
  "i": 72,
  "9": 73,
  "o": 74,
  "0": 75,
  "p": 76,
};
