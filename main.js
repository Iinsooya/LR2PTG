var container;
var camera, scene, renderer;
var planets = []; 
var orbitLines = []; 

var keyboard = new THREEx.KeyboardState(); 

var clock = new THREE.Clock(); 

var planetIndex = -1;
var alpha = 0;

init();
animate();

function animate() {
    var delta = clock.getDelta(); // Время с последнего кадра
    KeyDown(delta); 
    updatePlanets(delta); // Обновление движения планет    

    requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function init() {
    container = document.getElementById('container');
    scene = new THREE.Scene();

    // Камера
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.set(0, 300, 500);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xf00000, 1); // Чёрный фон
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    //создание точечного источника освещения заданного цвета
    var spotlight = new THREE.PointLight(0xffffff);

    //установка позиции источника освещения
    spotlight.position.set(0, 0, 0);
    //добавление источника в сцену
    scene.add(spotlight);

    Sun();
    Stars();
    Planet( 2.4,  "Меркурий/mercurymap.jpg", "Меркурий/mercurybump.jpg", 57.9, 0.24, 0.01);
    Planet( 7,  "Марс/marsmap1k.jpg", "Марс/marsbump1k.jpg", 227.9, 1.05, 0.01);
    Planet( 8, "Венера/venusmap.jpg", "Венера/venusbump.jpg",  108.2, 0.62, 0.008);
    Planet( 10, "Земля/earthmap1k.jpg", "Земля/earthbump1k.jpg", 149.6, 1.00, 0.005);
    Moon( 3, "Земля/Луна/moonmap1k.jpg", "Земля/Луна/moonbump1k.jpg", 20, 2, planets[3]);
    EarthCloud( 10.3, 149.6, 1.00, 0.005); 
}

// Создание Солнца
function Sun() {
    const loader = new THREE.TextureLoader();
    var geometry = new THREE.SphereGeometry(25, 32, 32);
    var tex = loader.load("sunmap.jpg");
    var material = new THREE.MeshBasicMaterial({ map: tex });
    var sun = new THREE.Mesh(geometry, material);

    scene.add(sun);
    sun.position.set(0, 0, 0);
}

// Создание звёздного неба
function Stars() {
    const loader = new THREE.TextureLoader();
    var geometry = new THREE.SphereGeometry(1000, 64, 64);
    var tex = loader.load("starmap.jpg");
    var material = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
    var stars = new THREE.Mesh(geometry, material);
    scene.add(stars);
}

// Создание планеты
function Planet( size, texturePath, bumpPath,  orbitRadius, orbitSpeed, rotationSpeed) {
    const loader = new THREE.TextureLoader();
    var geometry = new THREE.SphereGeometry(size, 32, 32);
    var tex = loader.load(texturePath);
    tex.minFilter = THREE.NearestFilter;
    var bump = loader.load(bumpPath);

    var phongMaterial = new THREE.MeshPhongMaterial({
        map: tex,
        bumpMap: bump,
        bumpScale: 0.5,
        side: THREE.DoubleSide
    });

    var planet = new THREE.Mesh(geometry, phongMaterial);

    // Начальная позиция
    planet.position.set(orbitRadius, 0, 0);
    scene.add(planet);

    // Создание орбиты
    var orbit = Orbit(orbitRadius);
    scene.add(orbit);

    // Сохранение данных о планете
    planets.push({
        object: planet,
        orbitRadius: orbitRadius,
        orbitSpeed: orbitSpeed,
        rotationSpeed: rotationSpeed,
        orbitAngle: 0 ,
        r : size
    });
}

// Создание Луны
function Moon( size, texturePath, bumpPath, orbitRadius, orbitSpeed, parentPlanet) {
    const loader = new THREE.TextureLoader();
    var geometry = new THREE.SphereGeometry(size, 32, 32);
    var tex = loader.load(texturePath);
    tex.minFilter = THREE.NearestFilter;
    var bump = loader.load(bumpPath);

    var phongMaterial = new THREE.MeshPhongMaterial({
        map: tex,
        bumpMap: bump,
        bumpScale: 0.5,
        side: THREE.DoubleSide
    });

    var moon = new THREE.Mesh(geometry, phongMaterial);
    moon.position.set(parentPlanet.orbitRadius + orbitRadius, 0, 0);
    scene.add(moon);

    var moonOrbit = Orbit(orbitRadius);
    scene.add(moonOrbit); // Добавляем орбиту Луны

    planets.push({
        object: moon,
        orbitRadius: orbitRadius,
        orbitSpeed: orbitSpeed,
        rotationSpeed: 0.01,
        orbitAngle: 0,
        parent: parentPlanet.object,
        orbitLine: moonOrbit // Сохраняем орбиту Луны
    });
}


// Создание орбиты
function Orbit(radius) {
    var points = [];
    for (let i = 0; i <= 64; i++) {
        let angle = (i / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        ));
    }
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var dashed_material = new THREE.LineDashedMaterial({
        color: 0xffff00,
        dashSize: 2,
        gapSize: 4
    });
    
    var line = new THREE.LineLoop(geometry, dashed_material);
    line.computeLineDistances();
    return line;
}

// Обновление движения планет
function updatePlanets(delta) {
    planets.forEach(planet => {

        // Вращение планеты вокруг своей оси
        planet.object.rotation.y += planet.rotationSpeed;

        // Движение по орбите
        planet.orbitAngle += planet.orbitSpeed * delta;
        let center = planet.parent ? planet.parent.position : new THREE.Vector3(0, 0, 0);
        planet.object.position.x = center.x + Math.cos(planet.orbitAngle) * planet.orbitRadius;
        planet.object.position.z = center.z + Math.sin(planet.orbitAngle) * planet.orbitRadius;

       // Обновление орбиты Луны
        if (planet.parent) {
            let moonOrbit = planet.orbitLine;
            moonOrbit.position.x = planet.parent.position.x; // Центрируем орбиту Луны на Земле
            moonOrbit.position.z = planet.parent.position.z;
        }
    });
}

function KeyDown(delta) {
    
    if (keyboard.pressed("0")) {
        planetIndex = -1;
    } else if (keyboard.pressed("1")) {
        planetIndex = 0;
    } else if (keyboard.pressed("4")) {
        planetIndex = 1;
    } else if (keyboard.pressed("2")) {
        planetIndex = 2;
    } else if (keyboard.pressed("3")) {
        planetIndex = 3;
    } else if (keyboard.pressed("left")) {
       alpha += 10 * delta;
    } else if (keyboard.pressed("right")) {
        alpha -= 10 * delta;
    } 

    if (planetIndex > - 1)
    {
        var planet = planets[planetIndex];

        //получение матрицы позиции из матрицы объекта
        var m = new THREE.Matrix4();
        m.copyPosition(planet.object.matrix);
        //получение позиции из матрицы позиции
        var pos = new THREE.Vector3(0, 0, 0);
        pos.setFromMatrixPosition(m);
        var r = planet.r+50;

        var x = r * Math.cos(alpha) + pos.x;
        var z = r * Math.sin(alpha) + pos.z;

        camera.position.set(x, 0, z);
        camera.lookAt(pos);

    } else
    {
        camera.position.set(0, 300, 500);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

}


function EarthCloud(size, orbitRadius, orbitSpeed, rotationSpeed)
{
    // create destination canvas
    var canvasResult = document.createElement('canvas');
    canvasResult.width = 1024;
    canvasResult.height = 512;
    var contextResult = canvasResult.getContext('2d');
    // load earthcloudmap
    var imageMap = new Image();
    imageMap.addEventListener("load", function()
    {

    // create dataMap ImageData for earthcloudmap
    var canvasMap = document.createElement('canvas');
    canvasMap.width = imageMap.width;
    canvasMap.height = imageMap.height;
    var contextMap = canvasMap.getContext('2d');
    contextMap.drawImage(imageMap, 0, 0);
    var dataMap = contextMap.getImageData(0, 0, canvasMap.width, canvasMap.height);
    // load earthcloudmaptrans
    var imageTrans = new Image();
    imageTrans.addEventListener("load", function()
    {
    // create dataTrans ImageData for earthcloudmaptrans
    var canvasTrans = document.createElement('canvas');
    canvasTrans.width = imageTrans.width;
    canvasTrans.height = imageTrans.height;
    var contextTrans = canvasTrans.getContext('2d');
    contextTrans.drawImage(imageTrans, 0, 0);
    var dataTrans = contextTrans.getImageData(0, 0, canvasTrans.width,
    canvasTrans.height);
    // merge dataMap + dataTrans into dataResult
    var dataResult = contextMap.createImageData(canvasMap.width, canvasMap.height);
    for(var y = 0, offset = 0; y < imageMap.height; y++)
    for(var x = 0; x < imageMap.width; x++, offset += 4)
    {
    dataResult.data[offset+0] = dataMap.data[offset+0];
    dataResult.data[offset+1] = dataMap.data[offset+1];
    dataResult.data[offset+2] = dataMap.data[offset+2];
    dataResult.data[offset+3] = 255-dataTrans.data[offset+0];
    }
    // update texture with result
    contextResult.putImageData(dataResult,0,0)
    material.map.needsUpdate = true;
    });

    imageTrans.src = 'Земля/earthcloudmaptrans.jpg';
    }, false);

    imageMap.src = 'Земля/earthcloudmap.jpg';

    var geometry = new THREE.SphereGeometry(size, 64, 64);
    
    var material = new THREE.MeshPhongMaterial({
    map: new THREE.Texture(canvasResult),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
    });

    var planet = new THREE.Mesh(geometry, material);
    
    // Начальная позиция
    planet.position.set(orbitRadius, 0, 0);
    scene.add(planet);

    planets.push({
        object: planet,
        orbitRadius: orbitRadius,
        orbitSpeed: orbitSpeed,
        rotationSpeed: rotationSpeed,
        orbitAngle: 0 ,
        r : size
    });
        
}

    