import { ChangeEvent, useState } from 'react'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import './App.css'
import VmSim from './components/VmSim';

const CONFIG = Object.freeze({
	MAX: 64
})

function App() {
	const [virtualAddress, setVirtualAddress] = useState<number | ''>('')
	const [addrSubmit, setAddrSubmit] = useState<number>(0)

	const get_rand = () => {
		setVirtualAddress(Math.floor(Math.random() * CONFIG.MAX))
	}

	const enter_address = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (event.currentTarget.value.length == 0) {
			setVirtualAddress('')
		}
		else {
			setVirtualAddress(Number(event.currentTarget.value))
		}
	}

	const submit_address = () => {
		if (virtualAddress == '') {
			alert('Please enter a virtual address')
		}
		else if (virtualAddress < 0 || virtualAddress > CONFIG.MAX - 1) {
			alert('Enter a address between 0-63')
		}
		else {
			setAddrSubmit(virtualAddress)
		}
	}

	return (
		<Grid container spacing={10}>
			<Grid size={3} sx={{ marginTop: '100px' }}>
				<Stack>
					<TextField
						label="Virtual Address"
						type="number"
						size="small"
						value={virtualAddress}
						onChange={enter_address}
						slotProps={{
							inputLabel: {
								shrink: true,
							},
						}}
					/>
					<Stack direction="row" >
						<Button
							variant="outlined"
							sx={{ width: '100%' }}
							disabled={false}
							onClick={get_rand}
						>
							Rand
						</Button>
						<Button
							variant="outlined"
							sx={{ width: '100%' }}
							disabled={false}
							onClick={submit_address}
						>
							Ok
						</Button>
					</Stack>
				</Stack>
			</Grid>
			<Grid size={9}>
				<VmSim virtualAddress={addrSubmit}/>
			</Grid>
		</Grid>
	)
}

export default App
