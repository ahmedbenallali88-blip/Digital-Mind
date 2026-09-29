import express from "express";
import cors from "cors";

const app=express();
app.use(cors({origin:"*"}));
app.use(express.json({limit:"1mb"}));

const PORT=process.env.PORT||3000;
const OPENAI_API_KEY=process.env.OPENAI_API_KEY;
const MODEL=process.env.OPENAI_MODEL||"gpt-5.6-luna";

app.get("/health",(req,res)=>res.json({ok:true,service:"digital-mind-api"}));

app.post("/api/chat",async(req,res)=>{
  try{
    if(!OPENAI_API_KEY)return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
    const message=String(req.body?.message||"").trim();
    const history=Array.isArray(req.body?.history)?req.body.history.slice(-12):[];
    if(!message)return res.status(400).json({error:"message is required"});
    const input=[
      {role:"developer",content:"أنت العقل الرقمي، مساعد شخصي عربي عملي. كن واضحاً ومفيداً، وحوّل الطلبات المعقدة إلى خطوات قابلة للتنفيذ. لا تدّعي تنفيذ إجراء خارجي لم يتم تنفيذه فعلياً."},
      ...history.filter(x=>x&&["user","assistant"].includes(x.role)&&typeof x.content==="string").map(x=>({role:x.role,content:x.content})),
      {role:"user",content:message}
    ];
    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization:"Bearer "+OPENAI_API_KEY},
      body:JSON.stringify({model:MODEL,input})
    });
    const data=await r.json();
    if(!r.ok)return res.status(r.status).json({error:data?.error?.message||"OpenAI request failed"});
    res.json({reply:data.output_text||"لم يصل نص من النموذج.",response_id:data.id});
  }catch(e){res.status(500).json({error:"API error",detail:String(e?.message||e)})}
});

app.listen(PORT,()=>console.log("Digital Mind API listening on "+PORT));