import { ChangeEvent, useState } from 'react'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { CONFIG } from './utils/config';
import './App.css'
import VmSim from './components/VmSim';

function App() {
	const [virtualAddress, setVirtualAddress] = useState<number | ''>('')
	const [addrSubmit, setAddrSubmit] = useState<number | null>(null)
	const [toggleNext, setToggleNext] = useState<boolean>(false)

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
		if (virtualAddress === '') {
			alert('Please enter a virtual address')
		}
		else if (virtualAddress < 0 || virtualAddress > CONFIG.MAX - 1) {
			alert('Enter a address between 0-63')
		}
		else {
			setAddrSubmit(virtualAddress)
			setToggleNext(true)
		}
	}

	const handle_next = () => {
		const event = new CustomEvent('next.event')
		document.dispatchEvent(event)
	}

	return (
		<Grid container spacing={10}>
			<Grid size={3} sx={{ marginTop: '100px' }}>
				<Stack spacing={1}>
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
					<Stack direction="row" spacing={1} >
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
					<Button
						variant='outlined'
						disabled={!toggleNext}
						onClick={handle_next}
					>
						Next
					</Button>
				</Stack>
			</Grid>
			<Grid size={9}>
				<VmSim virtualAddress={addrSubmit === null ? -1 : addrSubmit} />
			</Grid>
		</Grid>
	)
}

export default App
