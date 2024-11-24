import { ChangeEvent, useReducer, useState } from 'react'
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { CONFIG } from './utils/config';
import './App.css'
import VmSim from './components/VmSim';

type InputState = {
	submittedAddress: number | null,
	nextToggle: boolean
}

type reducerAction = {
	type: 'submit' | 'end',
	address: number | null,
}

function App() {
	const [virtualAddress, setVirtualAddress] = useState<number | ''>('')

	const reducer = (state: InputState, action: reducerAction): InputState => {
		switch (action.type) {
			case 'submit':
				return {
					submittedAddress: action.address,
					nextToggle: true,
				}
			case 'end':
				return {
					...state,
					nextToggle: false,
				}
			default:
				return {
					...state
				}
		}
	}

	const [state, dispatchState] = useReducer(reducer, {
		submittedAddress: null,
		nextToggle: false
	})

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
			dispatchState({
				type: 'submit',
				address: virtualAddress,
			})
		}
	}

	const handle_next = () => {
		const event = new CustomEvent('next.event')
		document.dispatchEvent(event)
	}

	const [message, setMessage] = useState<string>('')
	const messasgeCallback = (msg: string) => {
		console.log(msg)
		setMessage(msg)
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
							disabled={state.nextToggle}
							onClick={submit_address}
						>
							Ok
						</Button>
					</Stack>
					<Box sx={{ height: '150px' }}>
						{message}
					</Box>
					<Button
						variant='outlined'
						disabled={!state.nextToggle}
						onClick={handle_next}
					>
						Next
					</Button>
				</Stack>
			</Grid>
			<Grid size={9}>
				<VmSim
					virtualAddress={state.submittedAddress === null ? -1 : state.submittedAddress}
					endCallback={() => dispatchState({
						type: 'end',
						address: state.submittedAddress,
					})}
					msgCallback={messasgeCallback}
				/>
			</Grid>
		</Grid>
	)
}

export default App
