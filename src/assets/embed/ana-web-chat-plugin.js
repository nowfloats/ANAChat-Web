(() => {
    let base = {
        uuidv4: () => {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).toString().replace(/[018]/g, function (c) { return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16); });
        },
        main: () => {
            let script = document.getElementById("ana-web-chat-script");
            let stompConfig = {
                endpoint: script.getAttribute("data-endpoint"),
                customerId: base.uuidv4(),
                businessId: script.getAttribute("data-businessid"),
                debug: script.getAttribute("data-debug") || false
            };
            let brandingConfig = {
                primaryBackgroundColor: script.getAttribute("data-primary-bg") || '#8cc83c',
                primaryForegroundColor: script.getAttribute("data-primary-fg") || 'white',
                secondaryBackgroundColor: script.getAttribute("data-secondary-bg") || 'black',
                logoUrl: script.getAttribute("data-logo-url") || 'http://ana.chat/favicon.ico',
                agentName: script.getAttribute("data-agent-name") || 'ANA',
                agentDesc: script.getAttribute("data-agent-desc") || 'ANA Conversation Suite',
                frameHeight: script.getAttribute("data-frame-height") || '500px',
                frameWidth: script.getAttribute("data-frame-width") || '360px',
                frameContentWidth: script.getAttribute("data-frame-content-width") || '360px'
            };
            let appConfig = {
                fileUploadEndpoint: script.getAttribute("data-file-upload-url")
            };
            let thirdPartyConfig = {
                googleMapsKey: script.getAttribute("data-gmaps-key")
            };
            let settings = {
                stompConfig,
                brandingConfig,
                appConfig,
                thirdPartyConfig
            };
            let iframeUrl = script.getAttribute("data-iframe-src") + "?s=" + btoa(JSON.stringify(settings));
			let styleInHead = `
   .ana-full {
      width: 100%;
      height: 100%;
    }

    .ana-root {
	  z-index: 1000000;
      position: fixed;
      bottom: 95px;
      right: 20px;
      height: ${brandingConfig.frameHeight};
      width: ${brandingConfig.frameWidth};
      background-color: transparent;
      font-family: 'Open Sans';
      display: block;
    }

    .ana-frame-container {
      box-shadow: 0px 6px 40px 1px rgba(0,0,0,0.36);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .ana-full-screen {
      background-color: rgba(0, 0, 0, 0.84);
    }

    .ana-iframe {
      border: none;
      width: 100%;
      flex-grow: 1;
      border-radius: inherit;
    }

    .ana-title {
      
    }

    .ana-content {
      display: inline;
    }

      .ana-content > .title {
        font-weight: bold;
        font-size: 18px;
        position: relative;
      }

      .ana-content > .subtitle {
        font-size: 11px;
      }

    .ana-online-dot {
      border-radius: 5px;
      height: 5px;
      width: 5px;
      background-color: #00DF50;
      border: 1px solid ${brandingConfig.primaryForegroundColor};
      position: absolute;
      bottom: 4px;
      transform: translate(4px, -0.5px);
    }

    .ana-actions > img {
      width: 50px;
    }

    .ana-minmax-btn {
	  z-index: 1000000;
      position: fixed;
      right: 20px;
      bottom: 20px;
      background-color: ${brandingConfig.primaryBackgroundColor};
      height: 60px;
      width: 60px;
      border-radius: 60px;
      cursor: pointer;
      box-shadow: 0px 6px 40px 1px rgba(0,0,0,0.36);
    }
    .ana-minmax-btn:hover {
      box-shadow: 0px 6px 40px 4px rgba(0,0,0,0.36);
    }
    .ana-minmax-btn>img,
	.ana-minmax-btn>.max-btn{
        width: 36px;
        height: 36px;
        margin: 12px;
    }
    
	.ana-min.ana-root {
      /*display: none;*/
    }

    @-webkit-keyframes fadeInDown {
      0% {
          opacity: 0;
          -webkit-transform: translateY(-20px);
      }
      100% {
          opacity: 1;
          -webkit-transform: translateY(0);
      }
    }
         
    @keyframes fadeInDown {
      0% {
          opacity: 0;
          transform: translateY(-20px);
      }
      100% {
          opacity: 1;
          transform: translateY(0);
      }
    }
         
    .fadeInDown {
      -webkit-animation-name: fadeInDown;
      animation-name: fadeInDown;
      -webkit-animation-duration: 0.3s;
      animation-duration: 0.3s;
      -webkit-animation-fill-mode: both;
      animation-fill-mode: both;
    }

    @-webkit-keyframes fadeOutUp {
      0% {
          opacity: 1;
          -webkit-transform: translateY(0);
      }
      100% {
          opacity: 0;
          display: none;
          -webkit-transform: translateY(-20px);
      }
    }
         
    @keyframes fadeOutUp {
      0% {
          opacity: 1;
          -webkit-transform: translateY(0);
      }
      100% {
          opacity: 0;
          display: block;
          -webkit-transform: translateY(-20px);
      }
    }
         
    .fadeOutUp {
      -webkit-animation-name: fadeOutUp;
      animation-name: fadeOutUp;
      -webkit-animation-duration: 0.3s;
      animation-duration: 0.3s;
      -webkit-animation-fill-mode: both;
      animation-fill-mode: both;
    }

    .ana-hidden {
      display: none;
    }
	.ana-minmax-btn > .btn{
		display: none;
	}
/* Smartphones (portrait and landscape) ----------- */
@media only screen and (min-device-width : 320px) and (max-device-width : 480px) {
	.ana-root{
		position: fixed;
		bottom: 0;
		right: 0;
		top: 0;
		border: 0;		
		height: 100%;
		width: 100vw;
	}
	.ana-max.ana-minmax-btn{
		border-radius: 3px;
		height: 24px;
		width: 24px;
		box-shadow: none;
		background-color: transparent;

		position: fixed;
		top: 15px;
		right: 10px;
	}
	.ana-max.ana-minmax-btn>.btn{
		opacity: 0.6;
	}
	.ana-max.ana-minmax-btn > img, 
	.ana-max.ana-minmax-btn > .max-btn{
		display: none;
	}
	.ana-max.ana-minmax-btn > .btn{
		display: block;
	}
}
`;
            let htmlIntoBody = `
    <div class="ana-root ana-min fadeOutUp ana-hidden" id="ana-root">
      <div class="ana-frame-container ana-full">
        <iframe src="${iframeUrl}" class="ana-iframe" scrolling="no"></iframe>
      </div>
    </div>
  <div class="ana-minmax-btn" id="ana-btn-minmax">
	  <div class="btn">
		<svg style="width:24px;height:24px" viewBox="0 0 24 24">
			<path fill="#ffffff" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,17L17,12H14V8H10V12H7L12,17Z" />
		</svg>
	  </div>
      <div class="max-btn">
		<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
<style type="text/css">
	.st0{fill:#FFFFFF;}
</style>
<g>
	<g>
		<path class="st0" d="M0,256c0,68.4,26.6,132.6,75,181c49.4,49.4,115,75,181.2,75c41.2,0,82.8-10,120.8-30.4
			c34.1,24.6,67.4,29.9,90.1,29.9c8.4,0,15.4-0.8,20.2-1.5c10.4-1.6,18.4-9.7,20-20.1s-3.7-20.5-13.1-25.1
			c-19.6-9.6-32.8-28.9-41-45.5c83.9-101,77.4-250.7-16.1-344.2c-48.4-48.4-112.6-75-181-75s-132.6,26.6-181,75S0,187.6,0,256z
			 M95.9,95.7c88.3-88.4,232.2-88.4,320.6,0c84.6,84.6,88.8,221,9.5,310.6c-2.1,2.4-3.2,5.3-3.6,8.2c-0.8,3-0.5,6.3,0.8,9.4
			c8.1,18.5,22,42.3,43.9,58.3h-0.1c-19.1,0-47.8-4.8-77.2-27.5c-0.3-0.3-0.8-0.6-1.2-0.9c-4.7-4.7-11.9-5.7-17.8-2.3
			c-89,52.3-202.1,37.8-275.2-35.3C7.4,327.9,7.4,184.1,95.9,95.7z"/>
		<circle class="st0" cx="256.1" cy="256" r="18"/>
		<circle class="st0" cx="163.5" cy="256" r="18"/>
		<circle class="st0" cx="348.8" cy="256" r="18"/>
	</g>
</g>
</svg>
	  </div>
  </div>
      `;

            let bodyScript = `
    (() => {  
      var minBtn = document.getElementById('ana-btn-minmax');
      minBtn.addEventListener('click', () => {
        let anaRoot = document.getElementById('ana-root');
        if (!anaRoot.classList.contains('ana-min')) {
          anaRoot.classList.add('ana-min');
		  minBtn.classList.remove('ana-max');
          anaRoot.classList.remove('fadeInDown');
          anaRoot.classList.add('fadeOutUp');
        }
        else {
          anaRoot.classList.remove('ana-min');
		  minBtn.classList.add('ana-max');
          anaRoot.classList.add('fadeInDown');
          anaRoot.classList.remove('ana-hidden');
          anaRoot.classList.remove('fadeOutUp');
        }
      });
    })();`;

            let fonts = document.createElement('link');
            fonts.href = 'https://fonts.googleapis.com/css?family=Open+Sans';
            fonts.type = "text/css";
            fonts.rel = "stylesheet";
            document.head.appendChild(fonts);

            let headStyle = document.createElement('style');
            headStyle.innerHTML = styleInHead;
            document.head.appendChild(headStyle);

            let divEle = document.createElement('div');
            divEle.innerHTML = htmlIntoBody;
            document.body.appendChild(divEle);

            let scriptEle = document.createElement('script')
            scriptEle.innerHTML = bodyScript
            document.body.appendChild(scriptEle);
        }
    }

    base.main();
})();
