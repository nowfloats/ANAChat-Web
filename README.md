# Ana Web Chat Plugin

[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](http://www.gnu.org/licenses/gpl-3.0)

Use Ana Web Chat Plugin to deploy your Ana chat bot onto your website. 

  - Brand it as your website.
  - Mobile friendly out of the box. 
  - A small code snippet to integrate it on any page. 

## Integration

**Step 1:**

Setup [Ana Conversation Studio and Ana Chat Server](https://github.com/Kitsune-tools/ProjectANA) to design and publish an Ana chat bot.
  - Assuming you have done that have an Ana Chat Server URL, let's call it `ana-chat-server.com`

**Step 2:**

Download `ana-web-chat-plugin.zip` from [releases](https://github.com/Kitsune-tools/ANAChat-Web/releases), extract and host it on any normal http server. Note the server URL. Let's call it `web-plugin.ana-chat-server.com`
   - If you want to host this at a path like `/web-plugin/` instead of the root of your server, you will also need to update `<base href="/">` inside `head` of `index.html` to `<base href="/web-plugin/">`. If you do it, Ana web chat plug-in server URL will now be `ana-chat-server.com/web-plugin/`

**Step 3:**

Using Ana Conversation Studio, design a chat bot, publish it and note down the chat project id. Let's call it `chat-bot-1` 
  - Click [here](https://github.com/Kitsune-tools/ProjectANA) if you have not setup Ana Conversation Studio and created your chat bot yet! 

**Step 4:**

You need few more things listed below
   - The color hex code you want your chat window to be in.   For Ana it's `#8cc83c`
   - Logo URL for the chat bot. For Ana it's `http://ana.chat/favicon.ico`
   - Your chat bot name and a small description.
   - If your chat bot asks for locations to the users, you will need a google api key with google static maps and google maps javaScript SDK enabled. Head over to [Google API Console](https://console.developers.google.com) to get one.  
 
**Step 5:**

Replace all the placeholders in the below code with the onces noted above, copy and paste it in your website's html file just above the &lt;/body&gt; (body's closing tag)

```
<script type="text/javascript" id="ana-web-chat-script"

src="http://<web-plugin.ana-chat-server.com>/assets/embed/ana-web-chat-plugin.js" 
data-endpoint="http://<ana-chat-server.com>:1205/wscustomers/chatcustomers-websocket"
data-businessid="chat-bot-1"
data-primary-bg="#8cc83c"

data-logo-url="<Your chat bot logo url>"
data-agent-name="<Chat bot name>"
data-agent-desc="<A small description>"

data-iframe-src="http://<web-plugin.ana-chat-server.com>/"
data-api-endpoint="http://<ana-chat-server.com>/"
data-gmaps-key="<Your Google Maps API Key>"

data-primary-fg="white"
data-secondary-bg="black"
data-frame-height="70vh"
data-frame-width="360px"

data-fullpage="true"
></script>
```

**Note:**
You also have other customisation options like chat window width (data-frame-width), height (data-frame-height), primary foreground color (data-primary-fg) etc. You can change them as per your needs.

## License

Ana Web Chat Plugin is available under the [GNU GPLv3 license](https://www.gnu.org/licenses/gpl-3.0.en.html).
