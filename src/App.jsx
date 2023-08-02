import { createSignal, onMount } from 'solid-js';
import styles from './styles/home.module.scss';
import { ID3Writer } from 'browser-id3-writer';
import ChooseCoverImg from './assets/ImagePlaceholder.png';
import { saveAs } from 'file-saver';

function App() {
	const [uploaded, setUploaded] = createSignal(false);
	const [file, setFile] = createSignal();
	const [fileName, setFileName] = createSignal('grab the wheel');

	//* Choose File
	const ChooseFile = () => {
		const [dragStatus, setDragStatus] = createSignal(0);
		const [errorUpload, setErrorUpload] = createSignal(false);
		const DragStatusClasses = ['leave', 'enter', 'dropped'];

		// Changing the File Signal

		const HandleChange = (e) => {
			setErrorUpload(false);
			e.preventDefault();
			e.stopPropagation();
			setDragStatus(2);
			const [fileUploaded] = e.target.files;

			//* ArrayBuffer

			const reader = new FileReader();

			reader.onload = function () {
				const arrayBuffer = reader.result;
				setFile(arrayBuffer);
				setUploaded(true);
				setFileName(fileUploaded.name);
			};
			reader.onerror = function () {
				//* handle error
				setErrorUpload(true);
				return null;
			};

			reader.readAsArrayBuffer(fileUploaded);
		};

		return (
			<>
				<div class={styles.text}>
					<h2>Upload the file:</h2>
					<h3>Supported extensions: mp3/flacc/wav </h3>
					{errorUpload() && <h4>Error, try again.</h4>}
				</div>
				<div class={styles.dragbox}>
					{dragStatus() == 2 ? (
						<p>Loading...</p>
					) : (
						<img
							class={styles[DragStatusClasses[dragStatus()]]}
							src="../src/assets/upload_button.png"
						></img>
					)}

					<input
						accept=".mp3,audio/*"
						onDragEnter={() => setDragStatus(1)}
						onDragLeave={() => setDragStatus(0)}
						onDrop={() => setDragStatus(2)}
						type="file"
						onChange={HandleChange}
					/>
				</div>
			</>
		);
	};

	return (
		<div class={styles.App}>
			<h1>Music Tag Editor</h1>
			<div class={styles.menu}>
				{uploaded() ? (
					<EditingFile file={file()} name={fileName()} />
				) : (
					<ChooseFile />
				)}
			</div>
		</div>
	);
}

const EditingFile = (props) => {
	const [downloadPhase, setDownloadPhase] = createSignal(false);
	const Details = [
		'Title',
		'Artists',
		'Album',
		'Album Artist',
		'Year',
		'Track #',
	];
	const [cover, setCover] = createSignal(null);
	const [songDetails, setSongDetails] = createSignal({
		Title: '',
		Artists: '',
		Album: '',
		AlbumArtist: '',
		Year: 2000,
		TrackListNumber: 0,
	});

	const HandleSongDetails = (type, info) => {
		if (type == 'Title') {
			setSongDetails({ ...songDetails(), Title: info });
		} else if (type == 'Artists') {
			setSongDetails({ ...songDetails(), Artists: info });
		} else if (type == 'Album') {
			setSongDetails({ ...songDetails(), Album: info });
		} else if (type == 'Album Artist') {
			setSongDetails({ ...songDetails(), AlbumArtist: info });
		} else if (type == 'Year') {
			setSongDetails({ ...songDetails(), Year: info });
		} else if (type == 'Track #') {
			setSongDetails({ ...songDetails(), TrackListNumber: info });
		}
	};

	const CoverChoice = () => {
		const HandleInputChange = (e) => {
			e.preventDefault();
			e.stopPropagation();
			const [fileUploaded] = e.target.files;

			const reader = new FileReader();
			reader.onload = function () {
				const arrayBuffer = reader.result;
				setCover([URL.createObjectURL(fileUploaded), arrayBuffer]);
			};
			reader.onerror = function () {
				//* handle error
				setErrorUpload(true);
				return null;
			};

			reader.readAsArrayBuffer(fileUploaded);
		};

		return (
			<div class={styles.coverbox}>
				<img src={cover() ? cover()[0] : ChooseCoverImg} />
				<input onchange={HandleInputChange} type="file" accept="image/*" />
			</div>
		);
	};

	const CancelHandle = () => {
		if (confirm('Are you sure to cancel the Task?') == true) {
			location.reload();
		}
	};

	const HandleDownload = () => {
		const FileBuffer = props.file;

		const writer = new ID3Writer(FileBuffer);
		writer
			.setFrame('TIT2', songDetails().Title)
			.setFrame('TPE1', songDetails().Artists.split(';'))
			.setFrame('TALB', songDetails().Album)
			.setFrame('TYER', parseInt(songDetails().Year))
			.setFrame('TRCK', songDetails().TrackListNumber)
			.setFrame('APIC', {
				type: 3,
				data: cover()[1],
				description: 'Album Cover',
			});
		writer.addTag();

		const songblob = writer.getBlob();
		saveAs(songblob, props.name);
	};

	return (
		<div class={styles.EditingFile}>
			<CoverChoice />
			<div class={styles.fileName}>
				<p class={styles.name}>{props.name}</p>
			</div>
			{Details.map((e) => (
				<div class={styles.entrybox}>
					<p>{e}:</p>
					<input
						onChange={(info) => HandleSongDetails(e, info.target.value)}
						placeholder={
							e == 'Artists'
								? 'In case of Multiple Artists use ; EX: "Drake;Lil Wayne"'
								: ''
						}
					></input>
				</div>
			))}
			<div class={styles.buttons}>
				<button class={styles.buttonConvert} onclick={CancelHandle}>
					Cancel
				</button>

				{downloadPhase() ? (
					<>
						<div class={styles.DownloadMenu}>
							<h2>Confirmation Page?</h2>
							<div class={styles.SongInfoBox}>
								<img src={cover()[0]}></img>
								<div class={styles.SongDetailsBox}>
									<p>Title: {songDetails().Title}</p>
									<p>Artists: {songDetails().Artists}</p>
									<p>Album: {songDetails().Album}</p>
									<p>Album Artist: {songDetails().AlbumArtist}</p>
									<p>Year: {songDetails().Year}</p>
									<p>TrackList #: {songDetails().TrackListNumber}</p>
								</div>
							</div>
							<button onClick={HandleDownload} class={styles.DownloadButton}>
								Convert and Download
							</button>
						</div>
						<div
							class={styles.BackgroundDrop}
							onClick={() => setDownloadPhase(false)}
						></div>
					</>
				) : (
					<></>
				)}

				<button
					class={styles.buttonConvert}
					onclick={() => setDownloadPhase(true)}
				>
					Download
				</button>
			</div>
		</div>
	);
};

export default App;
