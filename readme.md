# An Architect plugin for transforming images

## What it does

Drop large images in the static folder of an Architect app and request a transformed version. 


## Install

You can install the plugin for any Architect app with `npm install @enhance/arc-image-plugin`. You can then add it to your app manifest like this:

```arc
#app.arc
@app
image-app

@plugins
enhance/arc-image-plugin
```

## Use

The Architect framework serves static assets from a local folder that becomes an S3 bucket when deployed to AWS. 
You drop your `giant.jpeg` image in the `public` folder, and then once deployed, you can access it from anywhere.
In your app you can request `http://example.com/_static/giant.jpeg` or with a root relative path at `/_public/giant.jpeg`. 

With the image plugin, you can request the same image by swapping the “_static” for “transform” and include query parameters to get a different size (`/transform/width_100,height_100/giant.jpeg`). 
This will scale the image to fit in those dimensions while maintaining the aspect ratio. 

Other examples:
- /transform/format_avif,width_100,quality_50/_public/elephant.jpg
- /transform/format_webp,width_100,height_500/_public/elephant.png

## Supported formats
- png
- jpeg
- avif
- webp
- gif

## Parameters
- quality: specify the quality setting for lossy formats.
- format: The requested image format for the output.
- width: Output width
- height: Output height
- fit: type of placement
  - 'contain'(default): output will fit inside the specified height and width
  - 'cover': output will cover the height and width with the remaining portion cropped.
- focus: If the image is cropped what area is maintained as the focal point.
  - Options: 'top', 'right', 'bottom', 'left', 'top-right', 'bottom-right', 'bottom-left', 'top-left', 'center', 'point'
  - Default: 'center'
- mark: adds a marker to the chosen focal point of the image to temporarily identify the focal point.
  - Use with focus=point, x=<x-percentage>, and y=<y-percentage>
- x,y: Mark a focal point from the top left by percentage. Used with focus=point


The transformation maintains aspect ratio.


![Image transform flowchart](https://www.dropbox.com/s/7g31zg0nwbjnhwm/arc-image-plugin.drawio.png?raw=1)


The first time a request is made, it is transformed in a lambda and that new version is saved to an S3 bucket. 
The next request for that size is served from the cache. 


