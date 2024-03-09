// 引入所需模块
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');



const app = express();  // 初始化 Express 应用
app.use(cors());        // 允许跨域请求
app.use(express.json());// 解析 JSON 格式的请求体

// 设置 MySQL 连接
const db = mysql.createConnection({
    host: 'localhost', // 例如: 'localhost'
    user: 'root', // 例如: 'root'
    password: 'root',
    database: 'school-map'
});

// 获取位置列表--测试成功
app.get('/locations', (req, res) => {
  db.query('SELECT * FROM locations', (error, results) => {
    if (error) throw error;
    console.log("1.位置成功");
    res.send(results);
  });
});

// 添加一个新位置
app.post('/locations', (req, res) => {
  const location = req.body;
  db.query('INSERT INTO locations SET ?', location, (error, results) => {
    if (error) throw error;
    console.log("2.位置添加成功");
    res.status(201).send(`Location added with ID: ${results.insertId}`);
  });
});

// 更新位置信息
// 更新位置信息
app.put('/locations/:id', async (req, res) => {
  console.log('数据库连接成功');

  try {
    const locationId = parseInt(req.params.id);
    const updatedLocation = req.body;
    console.log('更新的位置信息：', updatedLocation);

    // 从数据库中查询位置信息
    const selectQuery = 'SELECT * FROM locations WHERE id = ?';
    db.query(selectQuery, [locationId], (selectError, selectResults) => {
      if (selectError) {
        console.error('位置查询失败', selectError);
        res.status(500).json({ error: '服务器内部错误' });
        return;
      }

      const existingLocation = selectResults && selectResults.length > 0 ? selectResults[0] : null;

      console.log('查询到的位置信息：', existingLocation);

      if (existingLocation) {
        // 更新数据库中的位置信息
        const updateQuery = `
          UPDATE locations
          SET name = ?, description = ?, latitude = ?, longitude = ?, imageUrl = ?
          WHERE id = ?
        `;

        const values = [
          updatedLocation.name,
          updatedLocation.description,
          updatedLocation.latitude,
          updatedLocation.longitude,
          updatedLocation.imageUrl,
          locationId
        ];

        db.query(updateQuery, values, (updateError, updateResults) => {
          if (updateError) {
            console.error('位置更新失败', updateError);
            res.status(500).json({ error: '服务器内部错误' });
            return;
          }

          console.log('位置信息已更新：', updatedLocation);

          res.status(200).json({ message: '位置信息已更新', updatedLocation });
          console.log("位置修改成功");
        });
      } else {
        res.status(404).json({ error: '未找到对应的位置信息' });
        console.log("未找到对应的位置信息");
      }
    });
  } catch (error) {
    console.error(error.stack); // 输出错误堆栈信息
    res.status(500).json({ error: '服务器内部错误' });
  }
});














// 删除位置
app.delete('/locations/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM locations WHERE id = ?', id, (error, results) => {
    if (error) throw error;
    console.log("4.位置删除成功");
  });
});

// 设置端口并启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
