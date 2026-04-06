document.addEventListener("DOMContentLoaded",()=>{
const chatContainer = document.getElementById("chat_container");
const input = document.getElementById("message_input");
const sendButton = document.getElementById("send_button");
const settingsButton = document.getElementById("settings_button");

// Settings panel reused from main.js
const settingsPanel = document.getElementById('settings_panel');
settingsButton.addEventListener('click',e=>{
    e.stopPropagation();
    settingsPanel.style.display = (settingsPanel.style.display==='block')?'none':'block';
});
document.addEventListener('click', e=>{
    if(!settingsPanel.contains(e.target) && e.target!==settingsButton)
        settingsPanel.style.display='none';
});

// Add message
function addMessage(text,type){
    const msg=document.createElement('div');
    msg.classList.add('message',type);
    msg.innerText=text;
    chatContainer.appendChild(msg);
    chatContainer.scrollTop=chatContainer.scrollHeight;
}

// Send message
let sessionMessages = 0;
async function sendMessage(){
    const text = input.value.trim();
    if(!text) return;
    addMessage(text,'user');
    input.value='';

    sessionMessages++;
    if(sessionMessages>50){
        addMessage("You're chatting a lot! Take a small break.",'ai');
        return;
    }

    // Typing indicator
    const typingMsg=document.createElement('div');
    typingMsg.classList.add('message','ai','typing');
    typingMsg.innerText='AI is typing...';
    chatContainer.appendChild(typingMsg);

    try{
        const response=await fetch('/chat',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({message:text})
        });
        const data=await response.json();
        typingMsg.classList.remove('typing');
        typingMsg.innerText=data.reply;
    }catch(err){
        typingMsg.innerText='AI unavailable';
    }
}

// Event listeners
sendButton.addEventListener('click',sendMessage);
input.addEventListener('keypress',e=>{ if(e.key==='Enter') sendMessage(); });
});
const settingsPanel = document.getElementById('settings_panel');

if(settingsPanel){
settingsButton.addEventListener('click', e=>{
e.stopPropagation();
settingsPanel.style.display =
(settingsPanel.style.display==='block')?'none':'block';
});
}