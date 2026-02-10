import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const testUpload = async () => {
    try {
        const form = new FormData();
        form.append('title', 'Test News Title');
        form.append('description', 'Test Description Content');
        form.append('category', 'Tech Update');
        form.append('status', 'Draft');
        form.append('publish_date', '2026-01-12');

        // Create a dummy file
        fs.writeFileSync('test-image.txt', 'dummy content');
        form.append('image', fs.createReadStream('test-image.txt'), 'test-image.txt'); // Intentionally txt to check filter initially, or rename to jpg

        // Actually, uploadMiddleware only allows images. Let's make it .jpg
        fs.writeFileSync('test-image.jpg', 'dummy image content');
        form.append('image', fs.createReadStream('test-image.jpg'), 'test-image.jpg');

        console.log('Sending request to https://workspace.prolync.in/api/news/add...');

        const response = await axios.post('https://workspace.prolync.in/api/news/add', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);

    } catch (error) {
        if (error.response) {
            console.error('Error Response Status:', error.response.status);
            console.error('Error Response Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

testUpload();
