import Grid from '@mui/material/Grid2'
import Stack from '@mui/material/Stack'
import React, { useState } from 'react'
import { CONFIG } from '../utils/config'

// tlb entries
type TLB = {
   VPN: number | null,
   PPN: number | null,
}

// page table entries
type PTB = {
   PPN: number | null,
   presentBit: boolean,
}

type PhysicalMem = {
   PPN: number,
}

export default function VmSim({ virtualAddress }: { virtualAddress: number }) {
   const virtualPageNumber = ((virtualAddress >>> 4) & 0x3).toString(2).padStart(2, '0')
   const virtualPageOffset = (virtualAddress & 0xf).toString(2).padStart(4, '0')

   const [tlbEntries, setTlbEntries] = useState<TLB[]>(() => {
      const entries: TLB[] = []
      for (let i = 0; i < CONFIG.TLB_SIZE; ++i) {
         entries.push({
            VPN: null,
            PPN: null
         })
      }
      return entries
   })

   const [pageTable, setPageTable] = useState<PTB[]>(() => {
      const entries: PTB[] = []
      for (let i = 0; i < CONFIG.PAGE_TBL_SIZE(); ++i) {
         entries.push({
            PPN: null,
            presentBit: false
         })
      }
      return entries
   })

   const [physicalMemory, setPhysicalMemory] = useState<PhysicalMem[]>(() => {
      const entries: PhysicalMem[] = []
      for (let i = 0; i < CONFIG.PHYSICAL_PAGES; ++i) {
         entries.push({
            PPN: i,
         })
      }
      return entries
   })

   return (
      <>
         <h2>Virtual Memory</h2>
         <Grid id='Virtual Address bits' container spacing={0}>
            <Grid size={4} sx={{ border: '1px solid grey' }}>
               Page Number
            </Grid>
            <Grid size={8} sx={{ border: '1px solid grey' }}>
               Page Offset
            </Grid>

            <Grid size={4} sx={{ border: '1px solid grey' }}>
               {virtualAddress === -1 ? '2-bits' : virtualPageNumber}
            </Grid>
            <Grid size={8} sx={{ border: '1px solid grey' }}>
               {virtualAddress === -1 ? '4-bits' : virtualPageOffset}
            </Grid>
         </Grid>

         <h4 style={{ margin: '30px 0 15px 0' }}>Translation Lookaside Buffer</h4>
         <Grid id='TLB' container spacing={0} sx={{ margin: '0 auto 0 auto', width: '70%' }}>
            <Grid size={2} sx={{ border: '1px solid grey' }}>#</Grid>
            <Grid size={5} sx={{ border: '1px solid grey' }}>
               VPN
            </Grid>
            <Grid size={5} sx={{ border: '1px solid grey' }}>
               PPN
            </Grid>

            {
               tlbEntries.map((tlb_entry, index) =>
                  <React.Fragment key={index}>
                     <Grid size={2} sx={{ border: '1px solid grey' }}>{index}</Grid>
                     <Grid size={5} sx={{ border: '1px solid grey' }}>{tlb_entry.VPN === null ? '-' : tlb_entry.VPN}</Grid>
                     <Grid size={5} sx={{ border: '1px solid grey' }}>{tlb_entry.PPN === null ? '-' : tlb_entry.PPN}</Grid>
                  </React.Fragment>
               )
            }
         </Grid>

         <Grid container spacing={10} id='PageTablePhysicalMemContainer'>
            <Grid size={7} id='PageTable'>
               <h4>Page Table</h4>
               <Grid container>
                  <Grid sx={{ border: '1px solid grey' }} size={2}>Index</Grid>
                  <Grid sx={{ border: '1px solid grey' }} size={3}>Present</Grid>
                  <Grid sx={{ border: '1px solid grey' }} size={7}>PPN</Grid>
                  {
                     pageTable.map((ptb_entry, index) =>
                        <React.Fragment key={index}>
                           <Grid size={2} sx={{ border: '1px solid grey' }}>{index}</Grid>
                           <Grid size={3} sx={{ border: '1px solid grey' }}>{ptb_entry.presentBit ? 1 : 0}</Grid>
                           <Grid size={7} sx={{ border: '1px solid grey' }}>{ptb_entry.PPN === null ? '-' : ptb_entry.PPN}</Grid>
                        </React.Fragment>
                     )
                  }
               </Grid>
            </Grid>

            <Grid size={5} id='PhysicalMemory'>
               <h4>Physical Memory</h4>
               <Grid container>
                  <Grid size={12} sx={{ border: '1px solid grey' }}>Physical Pages</Grid>
                  {
                     physicalMemory.map((entry, index) =>
                        <React.Fragment key={index}>
                           <Grid size={12} sx={{ border: '1px solid grey' }}>{entry.PPN}</Grid>
                        </React.Fragment>
                     )
                  }
               </Grid>
            </Grid>
         </Grid>




      </>
   )
}