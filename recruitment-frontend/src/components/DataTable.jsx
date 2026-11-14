import React,{useEffect,useState} from "react";
import {Table,TableHead,TableRow,TableCell,TableBody,TableContainer,TablePagination,Paper,Typography,Chip,IconButton,Tooltip} from "@mui/material";
import {VisibilityOutlined} from "@mui/icons-material";
export default function DataTable({columns,rows=[],onView,empty="No records found"}){
 const [page,setPage]=useState(0),[rowsPerPage,setRowsPerPage]=useState(25);
 useEffect(()=>setPage(0),[rows]);
 const visibleRows=rows.slice(page*rowsPerPage,page*rowsPerPage+rowsPerPage);
 return <TableContainer component={Paper} variant="outlined" sx={{borderRadius:2,boxShadow:"none"}}>
  <Table size="small"><TableHead><TableRow sx={{bgcolor:"#fafbff"}}>{columns.map(c=><TableCell key={c.key} sx={{fontWeight:750,whiteSpace:"nowrap"}}>{c.label}</TableCell>)}{onView&&<TableCell/>}</TableRow></TableHead>
   <TableBody>{visibleRows.map((r,i)=><TableRow hover key={r._id||page*rowsPerPage+i}>{columns.map(c=><TableCell key={c.key} sx={{maxWidth:260}}>{c.render?c.render(r):String(c.value?c.value(r):r[c.key]??"—")}</TableCell>)}{onView&&<TableCell align="right"><Tooltip title="Actions"><IconButton size="small" onClick={()=>onView(r)}><VisibilityOutlined fontSize="small"/></IconButton></Tooltip></TableCell>}</TableRow>)}{!rows.length&&<TableRow><TableCell colSpan={columns.length+Number(Boolean(onView))} align="center"><Typography color="text.secondary" py={3}>{empty}</Typography></TableCell></TableRow>}</TableBody>
  </Table>
  <TablePagination component="div" count={rows.length} page={page} onPageChange={(_,nextPage)=>setPage(nextPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={event=>{setRowsPerPage(Number(event.target.value));setPage(0)}} rowsPerPageOptions={[25,50,100]}/>
 </TableContainer>
}
export const StatusChip=({value})=>{const s=String(value||"—");const color=["APPROVED","OPEN","SHORTLISTED","PASS","ACCEPTED","HIRED","COMPLETED"].includes(s)?"success":["REJECTED","CANCELLED","CLOSED","FAIL","WITHDRAWN"].includes(s)?"error":["PENDING_APPROVAL","SCREENING","INTERVIEW","SENT","ON_HOLD","RESCHEDULED"].includes(s)?"warning":"default";return <Chip size="small" label={s.replaceAll("_"," ")} color={color} variant={color==="default"?"outlined":"filled"}/>};