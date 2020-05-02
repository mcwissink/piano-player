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
