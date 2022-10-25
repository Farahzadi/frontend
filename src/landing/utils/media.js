import  { createMedia } from '@artsy/fresnel';

const AppMedia  = createMedia({
    breakpoints: {
        xs: 0,
        sm: 450,
        md: 768,
        lg: 1024,
        xl: 1440,
    },
});

export const { Media, MediaContextProvider } = AppMedia;
export const mediaStyle = AppMedia.createMediaStyle();