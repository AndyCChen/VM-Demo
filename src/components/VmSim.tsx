import Grid from '@mui/material/Grid2'
import React, { useState } from 'react'

const TLB_SIZE = 3

type TLB = {
   VPN: number | null,
   PPN: number | null,
}

export default function VmSim({ virtualAddress }: { virtualAddress: number }) {
   const virtualPageNumber = ((virtualAddress >>> 4) & 0x3).toString(2).padStart(2, '0')
   const virtualPageOffset = (virtualAddress & 0xf).toString(2).padStart(4, '0')

   const [tlbEntries, setTlbEntries] = useState<TLB[]>(() => {
      const entries: TLB[] = []
      for (let i = 0; i < TLB_SIZE; ++i) {
         entries.push({
            VPN: null,
            PPN: null
         })
      }
      return entries
   })

   return (
      <>
         <h2>Virtual Memory</h2>
         <Grid id='Virtual Address bits' container spacing={0}>
            <Grid size={6} sx={{ border: '1px solid grey' }}>
               Page Number
            </Grid>
            <Grid size={6} sx={{ border: '1px solid grey' }}>
               Page Offset
            </Grid>

            <Grid size={6} sx={{ border: '1px solid grey' }}>
               {virtualAddress === -1 ? '2-bits' : virtualPageNumber}
            </Grid>
            <Grid size={6} sx={{ border: '1px solid grey' }}>
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

         




      </>
   )
}