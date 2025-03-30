import { readdir, readFile, rename, stat, writeFile } from 'fs/promises'

import markdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItToc from 'markdown-it-toc-done-right'
import markdownItHeaderSections from 'markdown-it-header-sections'

import * as shiki from 'shiki'

async function start() {
	const renderer = await initRenderer()

	const markdownFiles = (await readdir('.')).filter(file => file.endsWith('.md'))

	for (const markdownFilename of markdownFiles) {
		let htmlFilename: string
		let title: string
		let descripion: string
		let author: string

		if (markdownFilename == 'readme.md') {
			htmlFilename = 'index.html'

			title = 'The Island Programming Language'
			descripion = 'Multiparadigm general-purpose programming language, fusing aspects of functional, imperative, object-oriented, and various forms of declarative programming.'
			author = 'Rotem Dan'
		} else if (markdownFilename == 'lake.md') {
			htmlFilename = 'lake.html'

			title = 'The Lake Programming Language'
			descripion = 'Declarative programming language designed for components.'
			author = 'Rotem Dan'
		} else {
			htmlFilename = markdownFilename.replace('.md', '.html')
		}

		async function onModified() {
			await renderMarkdownFile(markdownFilename, htmlFilename, renderer, title = title, descripion = descripion, author = author)
		}

		watchFile(markdownFilename, onModified)
	}

	await startLiveServer()
}

async function initRenderer() {
	const islandLanguage = {
		id: 'island',
		scopeName: 'source.island',
		path: 'C:\\Users\\X\\.vscode\\extensions\\rotem.island-syntax-highlighting-0.0.1\\syntaxes\\island.tmLanguage.json',
		aliases: ['isl']
	}

	const lakeLanguage = {
		id: 'lake',
		scopeName: 'source.lake',
		path: 'C:\\Users\\X\\.vscode\\extensions\\rotem.lake-syntax-highlighting-0.0.1\\syntaxes\\lake.tmLanguage.json',
		aliases: ['lake']
	}

	const rotemLightTheme = await shiki.loadTheme('C:\\Users\\X\\.vscode\\extensions\\rotem.light-theme-0.0.1\\themes\\rotem-light-theme.json')

	const highlighter = await shiki.getHighlighter({
		langs: [...shiki.BUNDLED_LANGUAGES, islandLanguage, lakeLanguage],
		theme: rotemLightTheme
	})

	const renderer = markdownIt({
		html: true,
		highlight: (code, lang) => {
			return highlighter.codeToHtml(code, { lang })
		}
	}).use(markdownItToc, {})
		.use(markdownItHeaderSections, {})
		.use(markdownItAnchor, { permalink: markdownItAnchor.permalink.linkInsideHeader({ symbol: '§' }), tabIndex: false })

	return renderer
}

async function renderMarkdownFile(inFilename: string, outFilename: string, renderer: any, title = 'Untitled', description = '', author = 'Anonymous') {
	try {
		const markdownContent = await readFile(inFilename, 'utf-8')

		console.log(`\n[${new Date().toLocaleTimeString()}]\nRendering ${inFilename}..`)
		const startTime = performance.now()
		const renderedHtml = await renderMarkdownToHtml(markdownContent, renderer, title = title, description = description, author = author)
		console.log(`Rendered in ${(performance.now() - startTime).toFixed(2)}ms`)

		const tempFilename = `${outFilename}.${Math.random().toString().substring(2)}.temp`

		await writeFile(tempFilename, renderedHtml)
		await tryRename(tempFilename, outFilename)

		console.log(`Wrote ${outFilename}`)
	} catch (e) {
		console.log(e)
		return
	}
}

async function renderMarkdownToHtml(markdown: string, renderer: any, title: string, description: string, author: string) {
	const htmlBody = renderer.render(markdown)

	const outHtml = `
<!doctype html>

<html lang="en">
<head>
	<meta charset="utf-8">

	<title>${title}</title>
	<meta name="description" content="${description}">
	<meta name="author" content="${author}">

	<!-- Favicon is courstey of freepik.com -->
	<link rel="shortcut icon" href="icons/oasis-32x32.png" />
	<link rel="stylesheet" href="styles/main.css">
</head>

<body>
<main id="main-content">
${htmlBody}
</main>

<footer>
	<p id="last-modified">
		<i>Last edited: ${new Date().toLocaleString('en-us', { year: 'numeric', month: 'long', day: 'numeric' })}</i>
	</p>
</footer>
</body>
</html>
`
	return outHtml
}

async function watchFile(filename: string, onModified: Function, delay = 500) {
	let previousModifiedTime = 0

	while (true) {
		const modifiedTime = (await stat(filename)).mtime.valueOf()

		if (modifiedTime !== previousModifiedTime) {
			try {
				if (onModified) {
					await onModified()
				}
			}
			catch (e) {
				console.log(e)
			}
		}

		previousModifiedTime = modifiedTime

		await sleep(delay)
	}
}

async function tryRename(tempFilename: string, outFilename: string) {
	while (true) {
		try {
			await rename(tempFilename, outFilename)
			return
		} catch {
			console.log(`Failed renaming ${tempFilename} to ${outFilename}, retrying in 100ms..`)
			await sleep(100)
		}
	}
}

function sleep(timeMs: number) {
	return new Promise(resolve => setTimeout(resolve, timeMs))
}

async function startLiveServer() {
	const { default: liveServer } = await import('live-server')

	liveServer.start({
		port: 5000,
		wait: 0,
		root: './',
		ignore: '**/.vscode/**, **/.git/**, **/node_modules/**, .src/**, .dist/**, ./notes/**, **/*.temp, **/*.json, **/*.md',
		open: false
	})
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Unused
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function createStaticServer() {
	const { default: express } = await import('express')
	const { default: serveStatic } = await import('serve-static')

	const app = express()

	app.use(serveStatic('./', {}))
	app.listen(5001)

	return app
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Starter
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
start()
