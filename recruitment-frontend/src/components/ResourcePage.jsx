import React,{useEffect,useMemo,useState} from "react";
import {Alert,Button,Stack,TextField,IconButton,Tooltip} from "@mui/material";
import {AddRounded,RefreshRounded,SearchRounded} from "@mui/icons-material";
import api from "../api";
import {getResource} from "../dataSource";
import DataTable from "./DataTable";
import {PageState} from "./Ui";
export default function ResourcePage({title,endpoint,columns,formFields=[],searchParam,actions=[],createPayload,extraToolbar,renderActions}){
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[query,setQuery]=useState(""),[open,setOpen]=useState(false),[form,setForm]=useState({}),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const load=async()=>{setLoading(true);setError("");try{const r=await getResource(endpoint,{params:searchParam&&query?{[searchParam]:query}:undefined});const d=r.data;setRows(Array.isArray(d.data)?d.data:Array.isArray(d)?d: d.data?.items||[]);}catch(e){setError(e.message)}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const filtered=useMemo(()=>!searchParam&&query?rows.filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase())):rows,[rows,query,searchParam]);
 const save=async()=>{setBusy(true);setNotice("");try{await api.post(endpoint,createPayload?createPayload(form):form);setOpen(false);setForm({});setNotice(`${title} created successfully`);await load()}catch(e){setError(e.message)}finally{setBusy(false)}};
 const act=async(r,a)=>{const id=r._id;try{let body=a.body? a.body(r):{};await api[a.method||"post"](`${endpoint}/${id}${a.path}`,body);setNotice(a.success||"Action completed");await load()}catch(e){setError(e.message)}};
 return <Stack spacing={2}>
  {notice&&<Alert severity="success" onClose={()=>setNotice("")}>{notice}</Alert>}
  <Stack direction={{xs:"column",sm:"row"}} spacing={1} alignItems={{sm:"center"}}><TextField size="small" placeholder={`Search ${title.toLowerCase()}...`} value={query} onChange={e=>setQuery(e.target.value)} InputProps={{startAdornment:<SearchRounded fontSize="small" sx={{mr:1,color:"text.secondary"}}/>}} sx={{minWidth:260}}/><Tooltip title="Refresh"><IconButton onClick={load}><RefreshRounded/></IconButton></Tooltip><Stack direction="row" spacing={1} sx={{ml:"auto!important"}}>{extraToolbar}{formFields.length>0&&<Button variant="contained" startIcon={<AddRounded/>} onClick={()=>setOpen(true)}>Create {title.slice(0,-1)||title}</Button>}</Stack></Stack>
  <PageState loading={loading} error={error}><DataTable columns={columns} rows={filtered} onView={renderActions?undefined:undefined}/></PageState>
  {renderActions&&renderActions({rows,act,load})}
  {open&&<div/>}
  {/* Form rendered by the page-specific component */}
 </Stack>
}