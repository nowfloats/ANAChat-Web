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

```html
<script type="text/javascript" id="ana-web-chat-script"

src="http://<web-plugin.ana-chat-server.com>/assets/embed/ana-web-chat-plugin.js" 
ana-endpoint="http://<ana-chat-server.com>:1205/wscustomers/chatcustomers-websocket"
ana-businessid="chat-bot-1"
ana-primary-bg="#8cc83c"
ana-flowid="chat-project-id-1"

ana-logo-url="<Your chat bot logo url>"
ana-agent-name="<Chat bot name>"
ana-agent-desc="<A small description>"

ana-iframe-src="http://<web-plugin.ana-chat-server.com>/"
ana-api-endpoint="http://<ana-chat-server.com>/"
ana-gmaps-key="<Your Google Maps API Key>"

ana-primary-fg="white"
ana-secondary-bg="black"
ana-frame-height="70vh"
ana-frame-width="360px"

ana-fullpage="true"
></script>
```

**Advanced options**

```
No of seconds to wait and open the chat window automatically:
ana-auto-open="30" 

Show or hide chat reset button:
ana-allow-chat-reset="true" or "false"

Enable HTML formatting in messages:
ana-html-messages="true" or "false"

Load only current chat session in history:
ana-current-session-only="false" or "true"

Show or hide 'Powered by Ana':
ana-show-branding="true" or "false"

```

**Manual Initialization**

By default, the script will be initialized automatically. If you want to pass your own userId and any variables during the initialization, **you need to add** ```ana-manual-init="true"``` to the script tag and add the below snippet with the information you need. 
```
<script>
Ana(<user-id>, {
    "<variable1>":"<value1>",
    "<variable2>":"<value2>"
});
</script>
```

## License

Ana Web Chat Plugin is available under the [GNU GPLv3 license](https://www.gnu.org/licenses/gpl-3.0.en.html).
