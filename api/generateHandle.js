const { ipcMain, dialog } = require("electron");
const path = require("path");
const { SVGIcons2SVGFontStream } = require("svgicons2svgfont");
const { optimize } = require("svgo");
const svg2ttf = require("svg2ttf");
const fs = require("fs");

module.exports = function () {
	async function selectFolder() {
		// 아이콘 저장할 폴더 선택
		const dialogResult = await dialog.showOpenDialog({
			properties: ["openDirectory"],
		});

		const iconsData = data.icons;
		const fontFamilyName = data.projectInfo.fontName || "MyCustomFont";
		const fontPrefix = data.projectInfo.fontPrefix || '';
		if (!Array.isArray(iconsData) || iconsData.length === 0) {
			console.error("아이콘 데이터가 비어있거나 잘못된 형식입니다.");
			return null;
		}
		if (dialogResult.canceled || !dialogResult.filePaths || dialogResult.filePaths.length === 0) return null;

		return dialogResult.filePaths[0]; // 폴더 경로 반환
	}

	/**
	 * SVG 폰트 생성을 위한 함수
	 * @param {*} param0
	 * @returns
	 */
	async function generateFont({ data, folderPath }) {
		// 아이콘 정보 객체 생성
		const svgInfo = {
			...data.projectInfo,
			icons : data.icons,
		}
		const fontFamilyName = svgInfo.fontName || "MyCustomFont";
		fs.writeFileSync(path.join(folderPath, fontFamilyName + ".json"), JSON.stringify(svgInfo, null, 2), "utf8");

		return new Promise((resolve, reject) => {
			const fontStream = new SVGIcons2SVGFontStream({
				fontName: fontFamilyName,
				normalize: true,
				fontHeight: 1000, // 전체 높이 기준
				descent: 0,
				centerHorizontally: true,
			});

			const svgFontPath = path.join(folderPath, fontFamilyName + ".svg");
			const ttfFontPath = path.join(folderPath, fontFamilyName + ".ttf");

			// SVG Font 파일 스트림
			const svgFontWrite = fs.createWriteStream(svgFontPath);

			// SVG Font 파일 스트림에 쓰기
			fontStream.pipe(svgFontWrite).on("finish", () => {
				// SVG Font 파일을 읽어서 TTF 변환
				const svgFontContent = fs.readFileSync(svgFontPath, "utf8");
				const ttf = svg2ttf(svgFontContent, {});
				fs.writeFileSync(ttfFontPath, Buffer.from(ttf.buffer));

				resolve(svgInfo);
			});

			// 에러 처리
			fontStream.on("error", (err) => {
				reject(err);
			});

			// 여러 SVG 아이콘 추가
			svgInfo.icons.forEach((icon, index) => {
				const glyphStream = require("stream").Readable.from(icon.data);
				glyphStream.metadata = {
					unicode: [String.fromCharCode(parseInt(icon.code, 16))],
					name: icon.name,
				};
				fontStream.write(glyphStream);
			});

			fontStream.end();
		});
	}

	/**
	 * 폰트 저장을 위한 SVG 아이콘 최적화 함수
	 * @param {*} data
	 * @returns
	 */
	async function optimizeIcons(data) {
		const folderPath = await selectFolder();
		if (!folderPath) return null;

		let idx = 0;
		// 폴더 경로 선택됨
		const outputDir = path.join(folderPath, "optimized");
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		let newCss = "";
		const prefix = fontPrefix !== '' ? `i-${fontPrefix}-` : 'i-';
		for (const icon of iconsData) {
			if (icon.data && icon.data.trim() !== "") {
				try {
					// 최적화
					const result = optimize(icon.data, {
						multipass: true,
					});

					// 결과 파일로 저장
					const outputFilePath = path.join(outputDir, icon.name + ".svg");
					fs.writeFileSync(outputFilePath, result.data, "utf8");
					icon.data = result.data; // 최적화된 데이터로 업데이트
					icon.code = "0x" + (0xe001 + idx).toString(16);
					icon.updated = new Date().toISOString().replace("T", " ").substring(0, 19);

					newCss += `.${prefix}${icon.name}::before { content: "\\${icon.code.substring(2)}"; }\n`;


					idx += 1; // 인덱스 증가
				} catch (err) {
					console.error(`Error optimizing icon ${icon.name}:`, err);
				}
			}
		}
		const cssPath = path.join(__dirname, '../prototype.css');
		const copyPath = path.join(folderPath, fontFamilyName + ".css");
		let cssData = fs.readFileSync(cssPath, "utf8");
		if (fontPrefix !== '') {
			cssData = cssData.replace(/i-/g, prefix);
		}
		cssData = cssData.replace(/prototype/g, fontFamilyName);
		fs.writeFileSync(copyPath, cssData + '\n' + newCss, "utf8");

		return folderPath || null; // 폴더 경로 반환
	}

	/**
	 * SVG 폰트 생성 요청 수신
	 * @param {*} event
	 * @param {*} svgInfo
	 */
	ipcMain.on("generate-font", async (event, data) => {
		try {
			const folderPath = await optimizeIcons(data);
			if (!folderPath) {
				event.reply("generate-font-done", "폴더 선택이 취소되었습니다.");
				return;
			}
			const svgInfo = await generateFont({data, folderPath}); // 최적화된 데이터 사용
			console.log("SVG 아이콘 최적화 및 폰트 생성 완료:", folderPath, svgInfo);
			event.reply("generate-font-done", {
				path: folderPath, // 폴더 경로
				data: svgInfo, // SVG 아이콘 정보가 담긴 객체
			});
		} catch (err) {
			console.error("폰트 생성 실패:", err);
			event.reply("generate-font-done", "실패!");
		}
	});



	
	/**
	 * CSS Value Sheet 생성
	 * @param {*} data
	 * @returns
	 */
	async function generateVariable(data) {
		const folderPath = await selectFolder();
		if (!folderPath) return null;

		// 폴더 경로 선택됨
		if (!fs.existsSync(folderPath)) {
			fs.mkdirSync(folderPath, { recursive: true });
		}

		let newCss = ":root {\n";
		const prefix = fontPrefix !== '' ? `--i-${fontPrefix}-` : '--i-';
		for (const icon of iconsData) {
			if (icon.data && icon.data.trim() !== "") {
				try {
					// 최적화
					const result = optimize(icon.data, {
						multipass: true,
					});

					// 결과 파일로 저장
					icon.data = result.data; // 최적화된 데이터로 업데이트
					icon.updated = new Date().toISOString().replace("T", " ").substring(0, 19);

					const base64Data = `url('data:image/svg+xml;base64,${Buffer.from(result.data).toString('base64')}')`;
					newCss += `${prefix}${icon.name} : ${base64Data};\n`;


				} catch (err) {
					console.error(`Error optimizing icon ${icon.name}:`, err);
				}
			}
		}
		newCss += "}\n";
		// CSS 파일 생성
		const copyPath = path.join(folderPath, "icons.css");
		fs.writeFileSync(copyPath, newCss, "utf8");

		return folderPath || null; // 폴더 경로 반환
	}

	/**
	 * SVG 폰트 생성 요청 수신
	 * @param {*} event
	 * @param {*} svgInfo
	 */
	ipcMain.on("generate-variable", async (event, data) => {
		try {
			const folderPath = await generateVariable(data);
			if (!folderPath) {
				event.reply("generate-variable-done", "폴더 선택이 취소되었습니다.");
				return;
			}
			event.reply("generate-variable-done", {
				path: folderPath, // 폴더 경로
				data: "success", // SVG 아이콘 정보가 담긴 객체
			});
		} catch (err) {
			console.error("폰트 생성 실패:", err);
			event.reply("generate-variable-done", "실패!");
		}
	});
};