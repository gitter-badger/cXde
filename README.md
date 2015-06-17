# c♥de
### Introduction

[![Join the chat at https://gitter.im/baconface/cXde](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/baconface/cXde?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
c♥de is my handy dandy code prototyping tool thingy for web development. I have created it for my own means to test in languages I typically play with. However I think it can be a great tool to help others prototype and learn to code. Write your code and see your results in realtime. It doesn't need much more explaining than that. But I am going to talk a little more about it anyways.

When you fire up c♥de you should see a screen that kind of reminds you of [JSFiddle](http://jsfiddle.net/) and [Codepen](http://codepen.io/). Those sites are awesome but something completely different is happening behind the scenes here. A local development server is deployed running PHP. Not only can you code HTML, JavaScript, and CSS but you can use PHP as well.

Using the power of [CodeMirror](https://codemirror.net/) your editor will have an influx of features to aid in your development such as syntax highlighting, code folding, auto brackets, bracket/tag matching, key bindings, linting, and more.

That's not all doc! Your code is not injected but actually saved into files allowing for more accurate/easier debugging. Change your PHP binaries/configuration. Take advantage of [NW.js](http://nwjs.io/) powering this app and run IO.js/Node.js code/modules from the client side. Zoom in text because your eye sight sucks. Zoom out text because your eye sight is stupid awesome. Copy the dev URL and test in multiple browsers using the same codebase. Resize the panel areas. Load Chrome Developer Tools on the same screen. Change the look to one of 4 okayish looking themes. And some other stuff that may or may not be worth mentioning.

Currently releases will only be for Windows 32/64 and Linux 32/64. I don't own a Mac nor am I really handy with one. But I assume c♥de will run on one without issue.

Stupid screenshot makes it look blurry. But trust me it looks sharp as cheddar baby!
![](http://localabstract.com/uploads/codeongithub.png)

### Roadmap
Some things I do not have done but plan on implementing:
* Self signed certificate support (Waiting for a stable release of NW.js 0.13.x)
* Support for different preprocessors for styling, scripting, and markup
* Support for other serverside languages
* Multiple editor layouts
* Better refactored code
* Load and save scripts
* Together.js support
* Bug fixes
* Auto updater
* Simple plugin support
* Link to other browsers and auto refresh them on code changes

### Not an IDE
c♥de is a tool, not an IDE. Any IDE related feature requests like tabbed editors, multiple documents, projects, etc will likely be filed under WONT FIX in the issue manager. Two reasons why: It goes beyond the scope of what I want to do with c♥de and there are thousands of better editors out there already.

### Legal
There is a code editor out there by [Microsoft](https://microsoft.com/) called [Code](https://code.visualstudio.com/). Their project and my project are unrelated. If spelling the name of my tool spell it with a ♥ in place of the "o". If not possible spell it with an X. For example cXde is an acceptable name for this project.

Additionally the [awesome UI library](http://www.jeasyui.com/) used is released under the GPL. So obviously that makes this project released under the GPL as well. So play nice!