const { ipcMain, dialog } = require("electron");
const isDev = require("electron-is-dev");
const log = require('electron-log');
const path = require("path");
const { SVGIcons2SVGFontStream } = require("svgicons2svgfont");
const { optimize } = require("svgo");
const svg2ttf = require("svg2ttf");
const fs = require("fs");
const Sprite = require("svg-sprite");

module.exports = function () {
	async function selectFolder() {
		// 아이콘 저장할 폴더 선택
		const dialogResult = await dialog.showOpenDialog({
			properties: ["openDirectory"],
		});

		if (dialogResult.canceled || !dialogResult.filePaths || dialogResult.filePaths.length === 0) return null;

		return dialogResult.filePaths[0]; // 폴더 경로 반환
	}

	function generateJson(data, folderPath) {
		const filteredIcons = data.icons.filter(icon => icon.isClone !== true); // 클론 아이콘 제외
		
		const svgInfo = {
			...data.projectInfo,
			icons : filteredIcons,
		}
		const projectTitle = svgInfo.title || "sim";
		fs.writeFileSync(path.join(folderPath, projectTitle + ".json"), JSON.stringify(svgInfo, null, 2), "utf8");

		return svgInfo; // JSON 데이터 반환
	}

	/**
	 * SVG 폰트 생성을 위한 함수
	 * @param {*} param0
	 * @returns
	 */
	async function generateFont({ data, folderPath }) {
		const projectTitle = data.projectInfo.title || "sim";
		return new Promise((resolve, reject) => {
			const fontStream = new SVGIcons2SVGFontStream({
				fontName: projectTitle,
				normalize: true,
				fontHeight: 1000, // 전체 높이 기준
				descent: 0,
				centerHorizontally: true,
			});
			log.info(`Generating font for project: ${fontStream}`);

			const svgFontPath = path.join(folderPath, projectTitle + ".svg");
			const ttfFontPath = path.join(folderPath, projectTitle + ".ttf");

			// SVG Font 파일 스트림
			const svgFontWrite = fs.createWriteStream(svgFontPath);

			// SVG Font 파일 스트림에 쓰기
			fontStream.pipe(svgFontWrite).on("finish", () => {
				// SVG Font 파일을 읽어서 TTF 변환
				const svgFontContent = fs.readFileSync(svgFontPath, "utf8");
				const ttf = svg2ttf(svgFontContent, {});
				fs.writeFileSync(ttfFontPath, Buffer.from(ttf.buffer));

				resolve('success'); // 성공적으로 생성된 경우
			});

			// 에러 처리
			fontStream.on("error", (err) => {
				log.error(err);
				reject(err);
			});

			// 여러 SVG 아이콘 추가
			data.icons.forEach((icon, index) => {
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
	async function optimizeIcons(data, paramPath) {
		const folderPath = paramPath || await selectFolder();
		if (!folderPath) return null;

		const iconsData = data.icons;
		if (!Array.isArray(iconsData) || iconsData.length === 0) {
			console.error("아이콘 데이터가 비어있거나 잘못된 형식입니다.");
			return null;
		}

		const projectTitle = data.projectInfo.title || "sim";
		const fontPrefix = data.projectInfo.fontPrefix || '';
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
		const cssPath = isDev
		? path.join(__dirname, '../public/data/prototype.css')
		: path.join(__dirname, 'public', 'data', 'prototype.css');
		const copyPath = path.join(folderPath, projectTitle + ".css");
		let cssData = fs.readFileSync(cssPath, "utf8");
		if (fontPrefix !== '') {
			cssData = cssData.replace(/i-/g, prefix);
		}
		cssData = cssData.replace(/prototype/g, projectTitle);
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
			const svgInfo = generateJson(data, folderPath); // JSON 파일 생성
			await generateFont({data, folderPath}); // 최적화된 데이터 사용
			console.log("SVG 아이콘 최적화 및 폰트 생성 완료");
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
	async function generateVariable(data, paramPath) {
		const folderPath = paramPath || await selectFolder();
		if (!folderPath) return null;

		const iconsData = data.icons;
		if (!Array.isArray(iconsData) || iconsData.length === 0) {
			console.error("아이콘 데이터가 비어있거나 잘못된 형식입니다.");
			return null;
		}

		const colorSet = data.projectInfo.colorSet;
		let newIconsData = [];
		if (colorSet && colorSet.length > 0) {
			for (const icon of iconsData) {
				icon.data = icon.data.replace(/fill="[^"]*"/g, `fill="${data.projectInfo.baseColor}"`); // 기본 색상으로 변경
				newIconsData.push(icon); // 원본 아이콘 추가
				// 색상 세트에 따라 클론 아이콘 생성
				for (const d of colorSet) {
					const clonedIcon = { ...icon };
					clonedIcon.name = `${icon.name}${d.suffix ? `-${d.suffix}` : ''}`;
					clonedIcon.data = icon.data.replace(/fill="[^"]*"/g, `fill="${d.color}"`);
					clonedIcon.code = "";
					clonedIcon.isClone = true;
					newIconsData.push(clonedIcon);
				}
			}
		} else {
			newIconsData = iconsData;
		}

		const fontPrefix = data.projectInfo.fontPrefix || '';
		const projectTitle = data.projectInfo.title || "sim";
		let newCss = ":root {\n";
		const prefix = fontPrefix !== '' ? `--i-${fontPrefix}-` : '--i-';
		for (const icon of newIconsData) {
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
		const copyPath = path.join(folderPath, projectTitle +"Variables.css");
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
			const svgInfo = generateJson(data, folderPath); // JSON 파일 생성
			event.reply("generate-variable-done", {
				path: folderPath, // 폴더 경로
				data: svgInfo, // SVG 아이콘 정보가 담긴 객체
			});
		} catch (err) {
			console.error("폰트 생성 실패:", err);
			event.reply("generate-variable-done", "실패!");
		}
	});


	
	const spriteConfig = {
		mode: {
			css: {
				dest: 'sprite',      // 결과 파일 저장 폴더
				sprite: 'sprite.svg', // 스프라이트 SVG 파일명
				bust: false,       // 캐시방지용 query string 제거
				render: {
					css: true,
				}
			},
			stack: {
				dest: 'sprite',      // 결과 파일 저장 폴더
				sprite: 'stack.svg', // 스프라이트 SVG 파일명
				bust: false,       // 캐시방지용 query string 제거
				render: {
					css: false,
				}
			},
			view : {
				dest: 'sprite',      // 결과 파일 저장 폴더
				sprite: 'view.svg', // 스프라이트 SVG 파일명
				bust: false,       // 캐시방지용 query string 제거
				render: {
					css: false,
				}
			}
		}
	}
	/**
	 * CSS Value Sheet 생성
	 * @param {*} data
	 * @returns
	 */
	async function generateSprite(data, paramPath) {
		const folderPath = paramPath || await selectFolder(); // svg 아이콘 목록 경로
		if (!folderPath) return null;
		
		const iconsData = data.icons;
		if (!Array.isArray(iconsData) || iconsData.length === 0) {
			console.error("아이콘 데이터가 비어있거나 잘못된 형식입니다.");
			return null;
		}
		const projectTitle = data.projectInfo.title;
		const colorSet = data.projectInfo.colorSet;
		const fontPrefix = data.projectInfo.fontPrefix || '';
		const prefix = fontPrefix !== '' ? `i-${fontPrefix}-` : 'i-';
		let newIconsData = [];
		if (colorSet && colorSet.length > 0) {
			for (const icon of iconsData) {
				icon.data = icon.data.replace(/fill="[^"]*"/g, `fill="${data.projectInfo.baseColor}"`); // 기본 색상으로 변경
				newIconsData.push(icon); // 원본 아이콘 추가
				// 색상 세트에 따라 클론 아이콘 생성
				for (const d of colorSet) {
					const clonedIcon = { ...icon };
					clonedIcon.name = `${icon.name}${d.suffix ? `-${d.suffix}` : ''}`;
					clonedIcon.data = icon.data.replace(/fill="[^"]*"/g, `fill="${d.color}"`);
					clonedIcon.code = "";
					clonedIcon.isClone = true;
					newIconsData.push(clonedIcon);
				}
			}
		} else {
			newIconsData = iconsData;
		}

		const newFolderPath = path.join(folderPath, "sprite");
		if (!fs.existsSync(newFolderPath)) {
			fs.mkdirSync(newFolderPath, { recursive: true });
		}
		spriteConfig.mode.css.dest = newFolderPath; // 결과 파일 저장 폴더
		spriteConfig.mode.css.sprite = projectTitle + "Sprite.svg"; // 스프라이트 SVG 파일명
		spriteConfig.mode.stack.dest = newFolderPath; // 결과 파일 저장 폴더
		spriteConfig.mode.stack.sprite = projectTitle + "Stack.svg"; // 스택 SVG 파일명
		spriteConfig.mode.view.dest = newFolderPath; // 결과 파일 저장 폴더
		spriteConfig.mode.view.sprite = projectTitle + "View.svg"; // 뷰 SVG 파일명
		const sprite = new Sprite(spriteConfig);
		const fakePath = '/virtual/path/';
		for (const icon of newIconsData) {
			if (icon.data && icon.data.trim() !== "") {
				try {
					sprite.add(fakePath + prefix + icon.name + ".svg", prefix + icon.name + ".svg", icon.data);

				} catch (err) {
					console.error(`Error optimizing icon ${icon.name}:`, err);
				}
			}
		}
		sprite.compile((error, result) => {
			if (error) {
				console.error("Sprite compilation error:", error);
				return "compile error";
			}

			for (const mode in result) {
				for (const resource in result[mode]) {
					fs.writeFileSync(result[mode][resource].path, result[mode][resource].contents);
				}
			}
		});

		return folderPath || null; // 폴더 경로 반환
	}

	/**
	 * SVG 폰트 생성 요청 수신
	 * @param {*} event
	 * @param {*} svgInfo
	 */
	ipcMain.on("generate-sprite", async (event, data) => {
		try {
			const folderPath = await generateSprite(data);
			if (!folderPath) {
				event.reply("generate-sprite-done", "폴더 선택이 취소되었습니다.");
				return;
			} else if (folderPath === "compile error") {
				event.reply("generate-sprite-done", "스프라이트 컴파일 오류가 발생했습니다.");
				return;
			}
			const svgInfo = generateJson(data, folderPath); // JSON 파일 생성
			console.log("SVG Sprite 생성 완료");
			event.reply("generate-sprite-done", {
				path: folderPath, // 폴더 경로
				data: svgInfo, // SVG 아이콘 정보가 담긴 객체
			});
		} catch (err) {
			console.error("폰트 생성 실패:", err);
			event.reply("generate-sprite-done", "실패!");
		}
	});


	/**
	 * SVG 폰트 생성 요청 수신
	 * @param {*} event
	 * @param {*} svgInfo
	 */
	ipcMain.on("generate-all", async (event, data) => {
		try {
			const folderPath = await selectFolder(); // svg 아이콘 목록 경로
			if (!folderPath) {
				event.reply("generate-all-done", "폴더 선택이 취소되었습니다.");
				return;
			};

			// 폰트 생성
			await optimizeIcons(data, folderPath);
			await generateFont({data, folderPath}); // 최적화된 데이터 사용
			console.log("SVG 아이콘 최적화 및 폰트 생성 완료");

			// CSS Value Sheet 생성
			await generateVariable(data, folderPath);
			console.log("SVG Variable 생성 완료");

			// 스프라이트 생성
			const generatedSprite = await generateSprite(data, folderPath);
			if (generatedSprite === "compile error") {
				event.reply("generate-all-done", "스프라이트 컴파일 오류가 발생했습니다.");
				return;
			}
			console.log("SVG Sprite 생성 완료");

			// JSON 파일 생성
			const svgInfo = generateJson(data, folderPath);
			event.reply("generate-all-done", {
				path: folderPath, // 폴더 경로
				data: svgInfo, // SVG 아이콘 정보가 담긴 객체
			});
		} catch (err) {
			console.error("폰트 생성 실패:", err);
			event.reply("generate-all-done", "실패!");
		}
	});
};