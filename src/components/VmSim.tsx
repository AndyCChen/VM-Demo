import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box';

export default function VmSim({ virtualAddress }: { virtualAddress: number }) {

   const virtualPageNumber = ( (virtualAddress >>> 4) & 0x3 ).toString(2).padStart(2, '0')
   const virtualPageOffset = (virtualAddress & 0xf).toString(2).padStart(4, '0')

   return (
      <>
         <h1>Virtual Memory</h1>
         <Grid container spacing={0}>
            <Grid size={6}>
               <Box sx={{ border: '1px solid grey' }}>Page Number</Box>
            </Grid>
            <Grid size={6}>
               <Box sx={{ border: '1px solid grey' }}>Page Offset</Box>
            </Grid>
            <Grid size={6}>
               <Box sx={{ border: '1px solid grey' }}>
                  {virtualPageNumber === '0' ? '2-bits' : virtualPageNumber}
               </Box>
            </Grid>
            <Grid size={6}>
               <Box sx={{ border: '1px solid grey' }}>
                  {virtualPageOffset === '0' ? '4-bits' : virtualPageOffset}
               </Box>
            </Grid>
         </Grid>
      </>
   )
}