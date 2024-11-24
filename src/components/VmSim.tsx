import Grid from '@mui/material/Grid2'
//import Stack from '@mui/material/Stack'
import React, { useEffect, useRef, useState } from 'react'
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
   PAGE_TABLE_IDX: number | null,
}

enum VmState {
   TLB_SEARCH,
   TLB_HIT,
   TLB_MISS,
   TLB_EVICT,
   PAGE_TABLE_LOOKUP,
   PAGE_TABLE_FAULT,
   PAGE_TABLE_ENTRY_PRESENT,
   PAGE_TABLE_SWAP,
   PAGE_EVICT,
   TLB_END,
   PAGE_TABLE_END,
}

type VmSimProps = {
   virtualAddress: number, 
   endCallback: () => void,
   msgCallback: (msg: string) => void,
}

export default function VmSim({ virtualAddress, endCallback, msgCallback }: VmSimProps) {
   const vpn = (virtualAddress >>> 4) & 0x3
   const vpo = virtualAddress & 0xf
   const virtualPageNumber = vpn.toString(2).padStart(2, '0')
   const virtualPageOffset = vpo.toString(2).padStart(4, '0')

   const [tlb, setTlb] = useState<TLB[]>(() => {
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
            PAGE_TABLE_IDX: null
         })
      }
      return entries
   })

   const currentState = useRef<VmState>(VmState.TLB_SEARCH)
   const freePage = useRef<number>(-1) // index of a free physical page
   const freeTlbEntry = useRef<number>(-1) // index of a free tlb entry

   const nextState = () => {
      switch (currentState.current) {
         // begin
         case VmState.TLB_SEARCH:
            console.log('tlb search')
            if (tlb.find((entry) => entry.VPN === vpn) != undefined)
               currentState.current = VmState.TLB_HIT
            else
               currentState.current = VmState.TLB_MISS

            break

         // tlb hit
         case VmState.TLB_HIT:
            console.log('tlb hit')
            currentState.current = VmState.TLB_END
            break

         // tlb miss must reference page table
         case VmState.TLB_MISS:
            console.log('tlb miss')
            currentState.current = VmState.PAGE_TABLE_LOOKUP
            break
         case VmState.PAGE_TABLE_LOOKUP:
            console.log('page table lookup', vpn)
            if (pageTable[vpn].presentBit)
               currentState.current = VmState.PAGE_TABLE_ENTRY_PRESENT
            else
               currentState.current = VmState.PAGE_TABLE_FAULT

            break

         case VmState.PAGE_TABLE_ENTRY_PRESENT:
            freeTlbEntry.current = tlb.findIndex((entry) => entry.VPN === null && entry.PPN === null)
            if (freeTlbEntry.current != -1) {
               console.log('page table present, update tlb')
               setTlb(tlb.map((entry, index) => {
                  if (index === freeTlbEntry.current)
                     return { VPN: vpn, PPN: freePage.current }
                  else
                     return entry
               }))
               currentState.current = VmState.PAGE_TABLE_END
            }
            else {
               console.log('page table present, select tlb entry to evict')
               currentState.current = VmState.TLB_EVICT
            }
            break

         case VmState.PAGE_TABLE_FAULT:
            console.log('page fault')
            freePage.current = physicalMemory.findIndex((entry) => entry.PAGE_TABLE_IDX === null)
            if (freePage.current != -1) {
               currentState.current = VmState.PAGE_TABLE_SWAP
            }
            else
               currentState.current = VmState.PAGE_EVICT
            break
         case VmState.PAGE_TABLE_SWAP:
            setPhysicalMemory(physicalMemory.map((entry, index) => {
               if (index === freePage.current)
                  return { PPN: index, PAGE_TABLE_IDX: vpn }
               else
                  return entry
            }))

            setPageTable(pageTable.map((entry, index) => {
               if (index === vpn)
                  return { PPN: freePage.current, presentBit: true }
               else
                  return entry
            }))

            freeTlbEntry.current = tlb.findIndex((entry) => entry.VPN === null && entry.PPN === null)
            if (freeTlbEntry.current != -1) {
               console.log('page swap', freePage.current)

               setTlb(tlb.map((entry, index) => {
                  if (index === freeTlbEntry.current)
                     return { VPN: vpn, PPN: freePage.current }
                  else
                     return entry
               }))
               currentState.current = VmState.PAGE_TABLE_END
            }
            else {
               console.log('select tlb entry to evict')
               currentState.current = VmState.TLB_EVICT
            }
            break

         case VmState.TLB_EVICT:
            {
               let evit_index = Math.floor(Math.random() * CONFIG.TLB_SIZE)
               setTlb(tlb.map((entry, index) => {
                  if (index === evit_index)
                     return { VPN: vpn, PPN: pageTable[vpn].PPN }
                  else
                     return entry
               }))
               console.log('select tlb entry ', evit_index, ' to evict')
               currentState.current = VmState.PAGE_TABLE_END
               break
            }
         case VmState.PAGE_EVICT:
            {
               let evit_index = Math.floor(Math.random() * CONFIG.PHYSICAL_PAGES)
               let evicted_page: number
               freePage.current = evit_index

               setPhysicalMemory(physicalMemory.map((entry, index) => {
                  if (index === evit_index) {
                     evicted_page = entry.PAGE_TABLE_IDX as number
                     return { PPN: entry.PPN, PAGE_TABLE_IDX: vpn }
                  }
                  else
                     return entry
               }))

               setPageTable(pageTable.map((entry, index) => {
                  if (index === evicted_page)
                     return {...entry, presentBit: false}
                  else
                     return entry
               }))

               setTlb(tlb.map((entry, index) => {
                  if (entry.VPN === evicted_page)
                     return {VPN: null, PPN: null}
                  else
                     return entry
               }))

               console.log('select page in physical page ', evit_index, ' to evict')
               currentState.current = VmState.PAGE_TABLE_SWAP
               break
            }

         case VmState.TLB_END:
            console.log('page in tlb end')
            currentState.current = VmState.TLB_SEARCH
            endCallback()
            break
         case VmState.PAGE_TABLE_END:
            console.log('end')
            currentState.current = VmState.TLB_SEARCH
            endCallback()
            break

         default:
            alert('Invalid state!')
      }

   }

   useEffect(() => {
      document.addEventListener('next.event', nextState)
      return () => {
         document.removeEventListener('next.event', nextState)
      }
   },)

   return (
      <>
         <h2>Virtual Memory</h2>
         <Grid id='Virtual-Address-bits' container spacing={0}>
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
               tlb.map((tlb_entry, index) =>
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
                  <Grid size={6} sx={{ border: '1px solid grey' }}>Physical Pages</Grid>
                  <Grid size={6} sx={{ border: '1px solid grey' }}>Content</Grid>
                  {
                     physicalMemory.map((entry, index) =>
                        <React.Fragment key={index}>
                           <Grid size={6} sx={{ border: '1px solid grey' }}>{entry.PPN}</Grid>
                           <Grid size={6} sx={{ border: '1px solid grey' }}>{entry.PAGE_TABLE_IDX === null ? '-' : entry.PAGE_TABLE_IDX}</Grid>
                        </React.Fragment>
                     )
                  }
               </Grid>
            </Grid>
         </Grid>




      </>
   )
}