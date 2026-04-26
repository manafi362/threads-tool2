export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const script = `
(function () {
  var current = document.currentScript;
  if (!current) return;

  var token = current.dataset.token || "";
  if (!token) return;

  var sessionId = "";

  function toQuery(params) {
    return Object.keys(params)
      .map(function (key) {
        return encodeURIComponent(key) + "=" + encodeURIComponent(params[key]);
      })
      .join("&");
  }

  function applyPosition(wrap, preset, x, y) {
    wrap.style.left = "";
    wrap.style.right = "";
    wrap.style.top = "";
    wrap.style.bottom = "";

    if (preset === "custom") {
      wrap.style.left = x + "px";
      wrap.style.top = y + "px";
    } else if (preset === "bottom-left") {
      wrap.style.left = x + "px";
      wrap.style.bottom = y + "px";
    } else if (preset === "top-left") {
      wrap.style.left = x + "px";
      wrap.style.top = y + "px";
    } else if (preset === "top-right") {
      wrap.style.right = x + "px";
      wrap.style.top = y + "px";
    } else {
      wrap.style.right = x + "px";
      wrap.style.bottom = y + "px";
    }
  }

  function buildWidget(config) {
    var host = document.createElement("div");
    var shadow = host.attachShadow({ mode: "open" });
    document.body.appendChild(host);

    var style = document.createElement("style");
    style.textContent = [
      ":host{all:initial}",
      ".wrap{position:fixed;z-index:2147483000;font-family:ui-sans-serif,system-ui,sans-serif}",
      ".launcher{width:60px;height:60px;border:none;border-radius:999px;background:" + config.accentColor + ";color:#fff;box-shadow:0 18px 42px rgba(15,23,42,.28);cursor:pointer;font-size:13px;font-weight:700}",
      ".panel{width:320px;height:440px;background:#fff;border:1px solid rgba(15,23,42,.12);border-radius:22px;box-shadow:0 20px 50px rgba(15,23,42,.22);display:none;overflow:hidden}",
      ".panel.open{display:flex;flex-direction:column}",
      ".header{padding:16px;background:" + config.accentColor + ";color:#fff;font-weight:700}",
      ".messages{flex:1;padding:14px;background:#f8fafc;overflow:auto;display:flex;flex-direction:column;gap:10px}",
      ".bubble{max-width:85%;padding:10px 12px;border-radius:16px;line-height:1.5;font-size:13px;white-space:pre-wrap}",
      ".assistant{background:#fff;color:#0f172a;align-self:flex-start}",
      ".user{background:" + config.accentColor + ";color:#fff;align-self:flex-end}",
      ".composer{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(15,23,42,.08)}",
      ".input{flex:1;border:1px solid rgba(15,23,42,.15);border-radius:14px;padding:10px 12px;font-size:13px}",
      ".send{border:none;border-radius:14px;background:#0f172a;color:#fff;padding:0 14px;cursor:pointer}",
      ".stack{display:flex;flex-direction:column;gap:12px}"
    ].join("");
    shadow.appendChild(style);

    var wrap = document.createElement("div");
    wrap.className = "wrap";
    var stack = document.createElement("div");
    stack.className = "stack";
    var panel = document.createElement("div");
    panel.className = "panel";
    var header = document.createElement("div");
    header.className = "header";
    header.textContent = config.displayName;
    var messages = document.createElement("div");
    messages.className = "messages";
    var composer = document.createElement("form");
    composer.className = "composer";
    var input = document.createElement("input");
    input.className = "input";
    input.placeholder = "質問を入力";
    var send = document.createElement("button");
    send.className = "send";
    send.type = "submit";
    send.textContent = "送信";
    var launcher = document.createElement("button");
    launcher.className = "launcher";
    launcher.type = "button";
    launcher.setAttribute("aria-label", config.displayName);
    launcher.textContent = "Chat";

    composer.appendChild(input);
    composer.appendChild(send);
    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(composer);
    stack.appendChild(panel);
    stack.appendChild(launcher);
    wrap.appendChild(stack);
    shadow.appendChild(wrap);

    function addMessage(role, content) {
      var bubble = document.createElement("div");
      bubble.className = "bubble " + role;
      bubble.textContent = content;
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
    }

    addMessage("assistant", config.welcomeMessage);
    applyPosition(wrap, config.positionPreset, config.x, config.y);

    launcher.addEventListener("click", function () {
      var open = panel.classList.toggle("open");
      if (open) input.focus();
    });

    composer.addEventListener("submit", async function (event) {
      event.preventDefault();
      var question = input.value.trim();
      if (!question) return;
      addMessage("user", question);
      input.value = "";
      send.disabled = true;

      try {
        var response = await fetch("${origin}/api/prototype/chat", {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify({ question: question, sessionId: sessionId, token: token })
        });
        var data = await response.json();
        if (!response.ok) {
          addMessage("assistant", data.error || "チャットを利用できません。");
          return;
        }
        sessionId = data.sessionId || sessionId;
        addMessage("assistant", data.answer || "回答を生成できませんでした。");
      } catch (_error) {
        addMessage("assistant", "通信エラーが発生しました。時間をおいて再度お試しください。");
      } finally {
        send.disabled = false;
      }
    });
  }

  fetch("${origin}/api/prototype/public-config?" + toQuery({ token: token }), {
    method: "GET",
    mode: "cors"
  })
    .then(function (response) {
      if (!response.ok) return null;
      return response.json();
    })
    .then(function (data) {
      if (!data || !data.active || !data.widget) return;
      buildWidget(data.widget);
    })
    .catch(function () {
      return;
    });
})();
`.trim();

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
