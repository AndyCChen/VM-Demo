import Grid from '@mui/material/Grid2'
//import Stack from '@mui/material/Stack'
import React, { useEffect, useRef, useState } from 'react'
import { CONFIG, ItemStyle } from '../utils/config'

// tlb entries
type TLB = {
   VPN: number | null,
   PPN: number | null,
   focused: boolean
}

// page table entries
type PTB = {
   PPN: number | null,
   presentBit: boolean,
   focused: boolean
}

type PhysicalMem = {
   PPN: number,
   PAGE_TABLE_IDX: number | null,
   focused: boolean
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
   END,
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
            PPN: null,
            focused: false
         })
      }
      return entries
   })

   const [pageTable, setPageTable] = useState<PTB[]>(() => {
      const entries: PTB[] = []
      for (let i = 0; i < CONFIG.PAGE_TABLE_SIZE(); ++i) {
         entries.push({
            PPN: null,
            presentBit: false,
            focused: false,
         })
      }
      return entries
   })

   const [physicalMemory, setPhysicalMemory] = useState<PhysicalMem[]>(() => {
      const entries: PhysicalMem[] = []
      for (let i = 0; i < CONFIG.PHYSICAL_PAGES; ++i) {
         entries.push({
            PPN: i,
            PAGE_TABLE_IDX: null,
            focused: false
         })
      }
      return entries
   })

   const [physicalPageNum, setPhysicalPageNum] = useState<string | null>(null)
   const [pageOffset, setPageOffset] = useState<string | null>(null)

   const currentState = useRef<VmState>(VmState.TLB_SEARCH)
   const freePage = useRef<number>(-1) // index of a free physical page
   const freeTlbEntry = useRef<number>(-1) // index of a free tlb entry

   const clear_focused = () => {
      setTlb(tlb.map((entry) => {
         return { ...entry, focused: false }
      }))

      setPageTable(pageTable.map((entry) => {
         return { ...entry, focused: false }
      }))

      setPhysicalMemory(physicalMemory.map((entry) => {
         return { ...entry, focused: false }
      }))
   }

   const nextState = () => {
      switch (currentState.current) {
         // begin
         case VmState.TLB_SEARCH:
            msgCallback('Search tlb')
            setPhysicalPageNum(null)
            setPageOffset(null)
            if (tlb.find((entry) => entry.VPN === vpn) != undefined)
               currentState.current = VmState.TLB_HIT
            else
               currentState.current = VmState.TLB_MISS

            break

         // tlb hit
         case VmState.TLB_HIT:
            {
               msgCallback('Tlb hit')
               let idx = tlb.findIndex((entry) => entry.VPN === vpn)
               setTlb(tlb.map((entry, index) => {
                  if (index == idx)
                     return { ...entry, focused: true }
                  else
                     return entry
               }))
               currentState.current = VmState.END
               break
            }

         // tlb miss must reference page table
         case VmState.TLB_MISS:
            msgCallback('Tlb miss')
            currentState.current = VmState.PAGE_TABLE_LOOKUP
            break
         case VmState.PAGE_TABLE_LOOKUP:
            msgCallback(`Lookup page table at index ${vpn}`)
            setPageTable(pageTable.map((entry, index) => {
               if (index === vpn)
                  return { ...entry, focused: true }
               else
                  return entry
            }))
            if (pageTable[vpn].presentBit)
               currentState.current = VmState.PAGE_TABLE_ENTRY_PRESENT
            else
               currentState.current = VmState.PAGE_TABLE_FAULT

            break

         case VmState.PAGE_TABLE_ENTRY_PRESENT:
            freeTlbEntry.current = tlb.findIndex((entry) => entry.VPN === null && entry.PPN === null)
            if (freeTlbEntry.current != -1) {
               msgCallback('page table present, update tlb')
               setTlb(tlb.map((entry, index) => {
                  if (index === freeTlbEntry.current)
                     return { VPN: vpn, PPN: freePage.current, focused: true }
                  else
                     return entry
               }))
               currentState.current = VmState.END
            }
            else {
               msgCallback('page table present, select tlb entry to evict')
               currentState.current = VmState.TLB_EVICT
            }
            break

         case VmState.PAGE_TABLE_FAULT:
            msgCallback('Page fault')
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
                  return { PPN: index, PAGE_TABLE_IDX: vpn, focused: true }
               else
                  return entry
            }))

            setPageTable(pageTable.map((entry, index) => {
               if (index === vpn)
                  return { PPN: freePage.current, presentBit: true, focused: true }
               else
                  return entry
            }))

            freeTlbEntry.current = tlb.findIndex((entry) => entry.VPN === null && entry.PPN === null)
            if (freeTlbEntry.current != -1) {
               msgCallback(`Swap physical page ${freePage.current}, update page table and tlb`)

               setTlb(tlb.map((entry, index) => {
                  if (index === freeTlbEntry.current)
                     return { VPN: vpn, PPN: freePage.current, focused: true }
                  else
                     return entry
               }))
               currentState.current = VmState.END
            }
            else {
               msgCallback('Select tlb entry to evict')
               currentState.current = VmState.TLB_EVICT
            }
            break

         case VmState.TLB_EVICT:
            {
               let evit_index = Math.floor(Math.random() * CONFIG.TLB_SIZE)
               setTlb(tlb.map((entry, index) => {
                  if (index === evit_index)
                     return { VPN: vpn, PPN: pageTable[vpn].PPN, focused: true }
                  else
                     return entry
               }))
               msgCallback(`select tlb entry ${evit_index} to evict`)
               currentState.current = VmState.END
               break
            }
         case VmState.PAGE_EVICT:
            {
               let evict_index = Math.floor(Math.random() * CONFIG.PHYSICAL_PAGES)
               let evicted_page: number
               freePage.current = evict_index

               setPhysicalMemory(physicalMemory.map((entry, index) => {
                  if (index === evict_index) {
                     evicted_page = entry.PAGE_TABLE_IDX as number
                     return { PPN: entry.PPN, PAGE_TABLE_IDX: vpn, focused: true }
                  }
                  else
                     return entry
               }))

               setPageTable(pageTable.map((entry, index) => {
                  if (index === evicted_page)
                     return { ...entry, presentBit: false }
                  else
                     return entry
               }))

               setTlb(tlb.map((entry) => {
                  if (entry.VPN === evicted_page)
                     return { VPN: null, PPN: null, focused: true }
                  else
                     return entry
               }))

               msgCallback(`select page in physical page ${evict_index} to evict`)
               currentState.current = VmState.PAGE_TABLE_SWAP
               break
            }

         case VmState.END:
            {
               setPageOffset(virtualPageOffset)
               setPhysicalPageNum(pageTable[vpn].PPN?.toString(2).padStart(2, '0')!)
               clear_focused()
               msgCallback('')
               endCallback()
               currentState.current = VmState.TLB_SEARCH
               break
            }

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
         <h4>Virtual Address</h4>
         <Grid id='Virtual-Address-bits' container spacing={0}>
            <Grid size={4} border={ItemStyle.UNFOCUSED}>
               Page Number
            </Grid>
            <Grid size={8} border={ItemStyle.UNFOCUSED}>
               Page Offset
            </Grid>

            <Grid size={4} border={ItemStyle.UNFOCUSED}>
               {virtualAddress === -1 ? '2-bits' : virtualPageNumber}
            </Grid>
            <Grid size={8} border={ItemStyle.UNFOCUSED}>
               {virtualAddress === -1 ? '4-bits' : virtualPageOffset}
            </Grid>
         </Grid>

         <h4 style={{ margin: '30px 0 15px 0' }}>Translation Lookaside Buffer</h4>
         <Grid id='TLB' container spacing={0} sx={{ margin: '0 auto 0 auto', width: '70%' }}>
            <Grid size={2} border={ItemStyle.UNFOCUSED}>#</Grid>
            <Grid size={5} border={ItemStyle.UNFOCUSED}>
               VPN
            </Grid>
            <Grid size={5} border={ItemStyle.UNFOCUSED}>
               PPN
            </Grid>

            {
               tlb.map((tlb_entry, index) =>
                  <React.Fragment key={index}>
                     <Grid size={2} border={tlb_entry.focused ? ItemStyle.FOCUSED : ItemStyle.UNFOCUSED}>{index}</Grid>
                     <Grid size={5} border={tlb_entry.focused ? ItemStyle.FOCUSED : ItemStyle.UNFOCUSED}>{tlb_entry.VPN === null ? '-' : tlb_entry.VPN}</Grid>
                     <Grid size={5} border={tlb_entry.focused ? ItemStyle.FOCUSED : ItemStyle.UNFOCUSED}>{tlb_entry.PPN === null ? '-' : tlb_entry.PPN}</Grid>
                  </React.Fragment>
               )
            }
         </Grid>

         <Grid container spacing={10} id='PageTablePhysicalMemContainer'>
            <Grid size={7} id='PageTable'>
               <h4>Page Table</h4>
               <Grid container>
                  <Grid border={ItemStyle.UNFOCUSED} size={2}>Index</Grid>
                  <Grid border={ItemStyle.UNFOCUSED} size={3}>Present</Grid>
                  <Grid border={ItemStyle.UNFOCUSED} size={7}>PPN</Grid>
                  {
                     pageTable.map((ptb_entry, index) =>
                        <React.Fragment key={index} >
                           <Grid size={2} border={ptb_entry.focused ? ItemStyle.FOCUSED : ItemStyle.UNFOCUSED}>{index}</Grid>
                           <Grid size={3} border={ptb_entry.focused ? ItemStyle.FOCUSED : ItemStyle.UNFOCUSED}>{ptb_entry.presentBit ? 1 : 0}</Grid>
                           <Grid size={7} border={ptb_entry.focused ? ItemStyle.FOCUSED : ItemStyle.UNFOCUSED}>{ptb_entry.PPN === null ? '-' : ptb_entry.PPN}</Grid>
                        </React.Fragment>
                     )
                  }
               </Grid>
            </Grid>

            <Grid size={5} id='PhysicalMemory'>
               <h4>Physical Memory</h4>
               <Grid container>
                  <Grid size={6} border={ItemStyle.UNFOCUSED}>Physical Pages</Grid>
                  <Grid size={6} border={ItemStyle.UNFOCUSED}>Content</Grid>
                  {
                     physicalMemory.map((entry, index) =>
                        <React.Fragment key={index}>
                           <Grid size={6} border={entry.focused ? ItemStyle.FOCUSED : ItemStyle.UNFOCUSED}>{entry.PPN}</Grid>
                           <Grid size={6} border={entry.focused ? ItemStyle.FOCUSED : ItemStyle.UNFOCUSED}>{entry.PAGE_TABLE_IDX === null ? '-' : entry.PAGE_TABLE_IDX}</Grid>
                        </React.Fragment>
                     )
                  }
               </Grid>
            </Grid>
         </Grid>

         <h4>Physical Address</h4>
         <Grid container id='physical-address'>
            <Grid size={4} border={ItemStyle.UNFOCUSED}>
               Page Number
            </Grid>
            <Grid size={8} border={ItemStyle.UNFOCUSED}>
               Page Offset
            </Grid>

            <Grid size={4} border={ItemStyle.UNFOCUSED}>
               {physicalPageNum === null ? '-' : physicalPageNum}
            </Grid>
            <Grid size={8} border={ItemStyle.UNFOCUSED}>
               {pageOffset === null ? '-' : pageOffset}
            </Grid>
         </Grid>


      </>
   )
}