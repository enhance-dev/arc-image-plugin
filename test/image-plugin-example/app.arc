@app
plug-img-example

@static
fingerprint true

@http
get /

@plugins
enhance/arc-image-plugin
enhance/arc-plugin-enhance

@aws
profile begin-examples
region us-east-1

@begin
appID 1XP88P5Q
