globalThis.YT_CORPUS = [
  {
    "id": "motion",
    "title": "平抛运动的三个问题",
    "group": "运动学",
    "grade": "高一",
    "kind": "计算题",
    "duration": 86,
    "src": "media/motion.webm",
    "cues": [
      {
        "start": 0.65,
        "end": 8.5,
        "text": "第一道题。小球从 5 m 高处以 4 m/s 水平抛出，取 g = 10 m/s²，忽略空气阻力。求落地速度的大小。",
        "heading": "落地时有多快",
        "board": "h = 5 m     v₀ = 4 m/s",
        "poster": "media/motion-00.webp"
      },
      {
        "start": 9.3,
        "end": 17.5,
        "text": "平抛的竖直初速度为零。下落 5 m 后，竖直分速度的大小为 10 m/s。",
        "heading": "先求竖直分速度",
        "board": "v_y² = 2gh = 100 m²/s²",
        "poster": "media/motion-01.webp"
      },
      {
        "start": 18.3,
        "end": 26.5,
        "text": "水平分速度仍为 4 m/s。两个分速度互相垂直，落地速率约为 10.8 m/s。",
        "heading": "合成两个分量",
        "board": "v = √(4² + 10²) ≈ 10.8 m/s",
        "poster": "media/motion-02.webp"
      },
      {
        "start": 27.65,
        "end": 36.5,
        "text": "换一道题。小球以 4 m/s 从高 5 m 的平台边缘水平抛出，落到水平地面。忽略阻力，求水平射程。",
        "heading": "确定水平落点",
        "board": "h = 5 m     v₀ = 4 m/s",
        "poster": "media/motion-03.webp"
      },
      {
        "start": 37.3,
        "end": 46.5,
        "text": "取 g = 10 m/s²。竖直方向做自由落体运动，下降 5 m 需要 1 s，两个方向共用这个时间。",
        "heading": "用高度求飞行时间",
        "board": "h = ½gt²      t = √(2h/g) = 1 s",
        "poster": "media/motion-04.webp"
      },
      {
        "start": 47.3,
        "end": 55.5,
        "text": "水平方向做匀速直线运动。用初速度乘飞行时间，落地点到抛出点正下方的水平距离为 4 m。",
        "heading": "沿水平方向定位",
        "board": "x = v₀t = 4 × 1 = 4 m",
        "poster": "media/motion-05.webp"
      },
      {
        "start": 56.65,
        "end": 65.5,
        "text": "再看一个落点问题。从足够长的斜面顶端以 5 m/s 水平抛出小球，斜面向下倾斜 37°。求再次落到斜面所需的时间。",
        "heading": "落点受斜面约束",
        "board": "v₀ = 5 m/s     θ = 37°",
        "poster": "media/motion-06.webp"
      },
      {
        "start": 66.3,
        "end": 75.5,
        "text": "从斜面顶点取原点，竖直向下为正。落点满足位移条件，竖直位移除以水平位移等于斜面倾角的正切。",
        "heading": "写出两种位移",
        "board": "y/x = tan θ      x = v₀t",
        "poster": "media/motion-07.webp"
      },
      {
        "start": 76.3,
        "end": 85.5,
        "text": "用 y = gt²/2，代入斜面的几何关系。取 tan37° = 0.75，g = 10 m/s²，舍去出发时刻，飞行时间是 0.75 s。",
        "heading": "解出非零时刻",
        "board": "t = 2v₀ tan θ / g = 0.75 s",
        "poster": "media/motion-08.webp"
      }
    ]
  },
  {
    "id": "incline",
    "title": "斜面上的三种运动",
    "group": "动力学",
    "grade": "高一",
    "kind": "计算题",
    "duration": 82,
    "src": "media/incline.webm",
    "cues": [
      {
        "start": 0.65,
        "end": 8.5,
        "text": "先看光滑斜面。物块从静止沿 37° 的斜面下滑，取 g = 10 m/s²，求加速度。",
        "heading": "光滑斜面的加速度",
        "board": "θ = 37°     g = 10 m/s²",
        "poster": "media/incline-00.webp"
      },
      {
        "start": 9.3,
        "end": 17.5,
        "text": "支持力抵消重力垂直斜面的分量。斜面没有摩擦力，沿斜面向下的合力为重力的平行分量。",
        "heading": "沿斜面分解重力",
        "board": "F∥ = mg sin θ",
        "poster": "media/incline-01.webp"
      },
      {
        "start": 18.3,
        "end": 25.5,
        "text": "由牛顿第二定律得到 a = g sinθ。取 sin37° = 0.6，加速度为 6 m/s²，方向沿斜面向下。",
        "heading": "约去质量",
        "board": "a = g sin 37° = 6 m/s²",
        "poster": "media/incline-02.webp"
      },
      {
        "start": 26.65,
        "end": 35.5,
        "text": "下一题。物块正沿 37° 粗糙斜面向下滑动。动摩擦因数为 0.25，取 g = 10 m/s²。求下滑加速度。",
        "heading": "下滑时摩擦向上",
        "board": "θ = 37°      μ = 0.25",
        "poster": "media/incline-03.webp"
      },
      {
        "start": 36.3,
        "end": 45.5,
        "text": "物块相对斜面向下运动，滑动摩擦力沿斜面向上。支持力等于重力的法向分量，摩擦力大小是 μmg cosθ。",
        "heading": "求支持力与摩擦力",
        "board": "N = mg cos θ      f = μN",
        "poster": "media/incline-04.webp"
      },
      {
        "start": 46.3,
        "end": 54.5,
        "text": "取沿斜面向下为正。sin37° = 0.6，cos37° = 0.8，代入得加速度 4 m/s²。",
        "heading": "合力沿斜面向下",
        "board": "a = g(sin θ − μ cos θ) = 4 m/s²",
        "poster": "media/incline-05.webp"
      },
      {
        "start": 55.65,
        "end": 64.5,
        "text": "把物块以 8 m/s 沿 37° 粗糙斜面向上推出。动摩擦因数仍为 0.25，重力加速度取 10 m/s²。求上滑到静止需要的时间。",
        "heading": "上滑到停止",
        "board": "v₀ = 8 m/s     θ = 37°     μ = 0.25",
        "poster": "media/incline-06.webp"
      },
      {
        "start": 65.3,
        "end": 73.5,
        "text": "上滑过程中，重力分量和滑动摩擦力都沿斜面向下。因此减速的加速度大小为 8 m/s²。",
        "heading": "两个力都朝下",
        "board": "|a| = g(sin θ + μ cos θ) = 8 m/s²",
        "poster": "media/incline-07.webp"
      },
      {
        "start": 74.3,
        "end": 81.5,
        "text": "末速度为零。初速度 8 m/s 除以加速度大小 8 m/s²，得到上滑时间 1 s。",
        "heading": "代入停止条件",
        "board": "0 = v₀ − |a|t      t = 1 s",
        "poster": "media/incline-08.webp"
      }
    ]
  },
  {
    "id": "circuit",
    "title": "两个电阻的连接方式",
    "group": "恒定电流",
    "grade": "高二",
    "kind": "计算题",
    "duration": 52,
    "src": "media/circuit.webm",
    "cues": [
      {
        "start": 0.65,
        "end": 8.5,
        "text": "第一道电路题。3 Ω 和 6 Ω 的电阻串联，接在 9 V 的理想电源上。求 6 Ω 电阻两端的电压。",
        "heading": "串联电阻上的电压",
        "board": "R₁ = 3 Ω     R₂ = 6 Ω     U = 9 V",
        "poster": "media/circuit-00.webp"
      },
      {
        "start": 9.3,
        "end": 17.5,
        "text": "串联电路各处电流相同，总电阻等于两电阻之和。总电压除以 9 Ω，可得电流 1 A。",
        "heading": "先求整条支路的电流",
        "board": "I = U/(R₁ + R₂) = 1 A",
        "poster": "media/circuit-01.webp"
      },
      {
        "start": 18.3,
        "end": 25.5,
        "text": "把支路电流代入欧姆定律，6 Ω 电阻两端的电压为 6 V，另一个电阻分到 3 V。",
        "heading": "算出分电压",
        "board": "U₂ = IR₂ = 1 × 6 = 6 V",
        "poster": "media/circuit-02.webp"
      },
      {
        "start": 26.65,
        "end": 34.5,
        "text": "换一种接法。将 3 Ω 和 6 Ω 两个电阻并联，总电流为 3 A。求流过 6 Ω 支路的电流。",
        "heading": "并联支路的电流",
        "board": "R₁ = 3 Ω     R₂ = 6 Ω     I = 3 A",
        "poster": "media/circuit-03.webp"
      },
      {
        "start": 35.3,
        "end": 43.5,
        "text": "并联支路两端电压相等，所以电流与电阻成反比。3 Ω 支路的电流是 6 Ω 支路的两倍。",
        "heading": "用同电压列比例",
        "board": "I₁ / I₂ = R₂ / R₁ = 2",
        "poster": "media/circuit-04.webp"
      },
      {
        "start": 44.3,
        "end": 51.5,
        "text": "干路电流 3 A 是两个支路电流的和。因此 6 Ω 电阻中的电流为 1 A。",
        "heading": "两支路电流相加",
        "board": "I = I₁ + I₂ = 3I₂      I₂ = 1 A",
        "poster": "media/circuit-05.webp"
      }
    ]
  },
  {
    "id": "momentum",
    "title": "两车碰后共同运动",
    "group": "动量守恒",
    "grade": "高二",
    "kind": "计算题",
    "duration": 30,
    "src": "media/momentum.webm",
    "cues": [
      {
        "start": 0.65,
        "end": 9.5,
        "text": "光滑水平轨道上，2 kg 小车以 3 m/s 撞上静止的 1 kg 小车，两车粘在一起。求碰后共同速度。",
        "heading": "轻车与重车粘合",
        "board": "m₁ = 2 kg     m₂ = 1 kg     v₁ = 3 m/s",
        "poster": "media/momentum-00.webp"
      },
      {
        "start": 10.3,
        "end": 19.5,
        "text": "把两辆小车作为系统。碰撞过程水平方向不受外力，系统的总动量守恒，初始总动量为 6 kg·m/s。",
        "heading": "确定研究系统",
        "board": "p前 = m₁v₁ + m₂v₂ = 6 kg·m/s",
        "poster": "media/momentum-01.webp"
      },
      {
        "start": 20.3,
        "end": 29.5,
        "text": "碰后粘合，总质量为 3 kg。用总动量除以总质量，速度为 2 m/s，方向与入射小车相同。",
        "heading": "求共同速度",
        "board": "v = (m₁v₁ + m₂v₂)/(m₁ + m₂) = 2 m/s",
        "poster": "media/momentum-02.webp"
      }
    ]
  },
  {
    "id": "experiment",
    "title": "用等时间隔找平抛落点",
    "group": "运动学",
    "grade": "高一",
    "kind": "计算题",
    "duration": 29,
    "src": "media/experiment.webm",
    "cues": [
      {
        "start": 0.65,
        "end": 9.5,
        "text": "把平抛小球的位置每隔相同时间记录一次。平台高 5 m，初速度水平向右，为 4 m/s。忽略空气阻力，求落地时的水平距离。",
        "heading": "从频闪图找落点",
        "board": "h = 5 m     v₀ = 4 m/s",
        "poster": "media/experiment-00.webp"
      },
      {
        "start": 10.3,
        "end": 19.5,
        "text": "在竖直方向，小球从静止开始下落。代入 5 m 的高度，得到飞行时间 1 s；这对应频闪图上总共 1 s 的记录。",
        "heading": "由竖直落差确定时刻",
        "board": "g = 10 m/s²      t = √(2h/g) = 1 s",
        "poster": "media/experiment-01.webp"
      },
      {
        "start": 20.3,
        "end": 28.5,
        "text": "水平间距相等，因为水平速度不变。把各段水平位移相加，等于 4 m/s 乘以 1 s，所以水平射程是 4 m。",
        "heading": "相同时间内水平等距",
        "board": "Δx = v₀Δt      x = 4 m",
        "poster": "media/experiment-02.webp"
      }
    ]
  }
];
