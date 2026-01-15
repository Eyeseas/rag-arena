# OpenAPI definition


**简介**:OpenAPI definition


**HOST**:http://localhost:8901


**联系人**:


**Version**:v0


**接口路径**:/v3/api-docs


[TOC]






# 任务相关接口


## 添加任务


**接口地址**:`/task/add`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "title": "",
  "description": "",
  "supportUnit": "",
  "busDir": "",
  "workGoal": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userId||header|true|string||
|taskAdd|TaskAdd|body|true|TaskAdd|TaskAdd|
|&emsp;&emsp;title|任务名称||false|string||
|&emsp;&emsp;description|任务描述||false|string||
|&emsp;&emsp;supportUnit|支撑单位||false|string||
|&emsp;&emsp;busDir|业务方向||false|string||
|&emsp;&emsp;workGoal|工作目标||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultDTOBoolean|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|msg||string||
|data||boolean||


**响应示例**:
```javascript
{
	"code": 0,
	"msg": "",
	"data": true
}
```


## 修改任务名称


**接口地址**:`/task/rename`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|code||query|true|string||
|title||query|true|string||
|userId||header|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultDTOBoolean|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|msg||string||
|data||boolean||


**响应示例**:
```javascript
{
	"code": 0,
	"msg": "",
	"data": true
}
```


## 根据用户ID罗列其所有的任务


**接口地址**:`/task/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userId||header|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultDTOListCommonTreeDict|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|msg||string||
|data||array|CommonTreeDict|
|&emsp;&emsp;id||string||
|&emsp;&emsp;val||string||
|&emsp;&emsp;leaf||boolean||


**响应示例**:
```javascript
{
	"code": 0,
	"msg": "",
	"data": [
		{
			"id": "",
			"val": "",
			"leaf": true
		}
	]
}
```


## 修改任务名称


**接口地址**:`/task/del`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|code||query|true|string||
|userId||header|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultDTOBoolean|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|msg||string||
|data||boolean||


**响应示例**:
```javascript
{
	"code": 0,
	"msg": "",
	"data": true
}
```


# 会话相关接口


## 创建对话


**接口地址**:`/conv/create`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "taskId": "",
  "priId": "",
  "messages": [
    {
      "role": "",
      "content": ""
    }
  ],
  "session_id": "",
  "start_time": "",
  "end_time": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userId||header|true|string||
|chatMsgReq|ChatMsgReq|body|true|ChatMsgReq|ChatMsgReq|
|&emsp;&emsp;taskId|||true|string||
|&emsp;&emsp;priId|||false|string||
|&emsp;&emsp;messages|||false|array|ChatMessage|
|&emsp;&emsp;&emsp;&emsp;role|||false|string||
|&emsp;&emsp;&emsp;&emsp;content|||false|string||
|&emsp;&emsp;session_id|||false|string||
|&emsp;&emsp;start_time|||false|string(date-time)||
|&emsp;&emsp;end_time|||false|string(date-time)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultDTOConvCreatedVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|msg||string||
|data||ConvCreatedVO|ConvCreatedVO|
|&emsp;&emsp;sessionId|会话ID|string||
|&emsp;&emsp;priIdMapping|私有会话ID映射 私有ID,模型code|object||


**响应示例**:
```javascript
{
	"code": 0,
	"msg": "",
	"data": {
		"sessionId": "",
		"priIdMapping": {
			"ALPHA": "2c3f03052880ef0d2535a411e17ec52b",
			"BRAVO": "44a55a353da21c475975fcd611ba1986",
			"DELTA": "0d784b015da8bca3b272141dd7a6f30d",
			"CHARLIE": "dd78e6685f7e47b2c209c2bd4bd9b2c3"
		}
	}
}
```


## 对话开始


**接口地址**:`/conv/chat`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`text/event-stream`


**接口描述**:


**请求示例**:


```javascript
{
  "taskId": "",
  "priId": "",
  "messages": [
    {
      "role": "",
      "content": ""
    }
  ],
  "session_id": "",
  "start_time": "",
  "end_time": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|chatMsgReq|ChatMsgReq|body|true|ChatMsgReq|ChatMsgReq|
|&emsp;&emsp;taskId|||true|string||
|&emsp;&emsp;priId|||false|string||
|&emsp;&emsp;messages|||false|array|ChatMessage|
|&emsp;&emsp;&emsp;&emsp;role|||false|string||
|&emsp;&emsp;&emsp;&emsp;content|||false|string||
|&emsp;&emsp;session_id|||false|string||
|&emsp;&emsp;start_time|||false|string(date-time)||
|&emsp;&emsp;end_time|||false|string(date-time)||
|userId||header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ChatResponseVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|session_id||string||
|object||string||
|created||integer(int64)|integer(int64)|
|choices||array|ChatChoice|
|&emsp;&emsp;index||integer(int32)||
|&emsp;&emsp;delta||ChatDelta|ChatDelta|
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;finish_reason||string||
|citations||array|ChatCitation|
|&emsp;&emsp;id|引用标识ID|string||
|&emsp;&emsp;summary|引用的摘要内容|string||
|&emsp;&emsp;start_time|通话开始时间|string(date-time)||
|&emsp;&emsp;duration|通话时长,单位:秒|integer(int32)||
|&emsp;&emsp;callnumber|主叫号码|string||
|&emsp;&emsp;callednumber|被叫号码|string||
|&emsp;&emsp;labels|相关标签,用|分割|string||
|maskName||string||
|maskCode||string||
|privateId||string||


**响应示例**:
```javascript
[
	{
		"session_id": "",
		"object": "",
		"created": 0,
		"choices": [
			{
				"index": 0,
				"delta": {
					"content": ""
				},
				"finish_reason": ""
			}
		],
		"citations": [
			{
				"id": "",
				"summary": "",
				"start_time": "",
				"duration": 0,
				"callnumber": "",
				"callednumber": "",
				"labels": ""
			}
		],
		"maskName": "",
		"maskCode": "",
		"privateId": ""
	}
]
```


## 私聊


**接口地址**:`/conv/chat/pri`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`text/event-stream`


**接口描述**:


**请求示例**:


```javascript
{
  "taskId": "",
  "priId": "",
  "messages": [
    {
      "role": "",
      "content": ""
    }
  ],
  "session_id": "",
  "start_time": "",
  "end_time": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|chatMsgReq|ChatMsgReq|body|true|ChatMsgReq|ChatMsgReq|
|&emsp;&emsp;taskId|||true|string||
|&emsp;&emsp;priId|||false|string||
|&emsp;&emsp;messages|||false|array|ChatMessage|
|&emsp;&emsp;&emsp;&emsp;role|||false|string||
|&emsp;&emsp;&emsp;&emsp;content|||false|string||
|&emsp;&emsp;session_id|||false|string||
|&emsp;&emsp;start_time|||false|string(date-time)||
|&emsp;&emsp;end_time|||false|string(date-time)||
|userId||header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ChatResponseVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|session_id||string||
|object||string||
|created||integer(int64)|integer(int64)|
|choices||array|ChatChoice|
|&emsp;&emsp;index||integer(int32)||
|&emsp;&emsp;delta||ChatDelta|ChatDelta|
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;finish_reason||string||
|citations||array|ChatCitation|
|&emsp;&emsp;id|引用标识ID|string||
|&emsp;&emsp;summary|引用的摘要内容|string||
|&emsp;&emsp;start_time|通话开始时间|string(date-time)||
|&emsp;&emsp;duration|通话时长,单位:秒|integer(int32)||
|&emsp;&emsp;callnumber|主叫号码|string||
|&emsp;&emsp;callednumber|被叫号码|string||
|&emsp;&emsp;labels|相关标签,用|分割|string||
|maskName||string||
|maskCode||string||
|privateId||string||


**响应示例**:
```javascript
[
	{
		"session_id": "",
		"object": "",
		"created": 0,
		"choices": [
			{
				"index": 0,
				"delta": {
					"content": ""
				},
				"finish_reason": ""
			}
		],
		"citations": [
			{
				"id": "",
				"summary": "",
				"start_time": "",
				"duration": 0,
				"callnumber": "",
				"callednumber": "",
				"labels": ""
			}
		],
		"maskName": "",
		"maskCode": "",
		"privateId": ""
	}
]
```


## 点赞


**接口地址**:`/conv/like`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|priId|根据会话ID计算来的唯一ID|query|true|string||
|userId|用户ID|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultDTOBoolean|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|msg||string||
|data||boolean||


**响应示例**:
```javascript
{
	"code": 0,
	"msg": "",
	"data": true
}
```


## 历史记录


**接口地址**:`/conv/his`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|sessionId||query|true|string||
|priId||query|false|string||
|userId||header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultDTOHistoryChatVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|msg||string||
|data||HistoryChatVO|HistoryChatVO|
|&emsp;&emsp;sessionId||string||
|&emsp;&emsp;question||string||
|&emsp;&emsp;chatMap||ChatResponseVO|ChatResponseVO|
|&emsp;&emsp;&emsp;&emsp;session_id||string||
|&emsp;&emsp;&emsp;&emsp;object||string||
|&emsp;&emsp;&emsp;&emsp;created||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;choices||array|ChatChoice|
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;index||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;delta||ChatDelta|ChatDelta|
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;finish_reason||string||
|&emsp;&emsp;&emsp;&emsp;citations||array|ChatCitation|
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;id||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;summary||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;start_time||string(date-time)||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;duration||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;callnumber||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;callednumber||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;labels||string||
|&emsp;&emsp;&emsp;&emsp;maskName||string||
|&emsp;&emsp;&emsp;&emsp;maskCode||string||
|&emsp;&emsp;&emsp;&emsp;privateId||string||


**响应示例**:
```javascript
{
	"code": 0,
	"msg": "",
	"data": {
		"sessionId": "",
		"question": "",
		"chatMap": {
			"additionalProperties1": [
				{
					"session_id": "",
					"object": "",
					"created": 0,
					"choices": [
						{
							"index": 0,
							"delta": {
								"content": ""
							},
							"finish_reason": ""
						}
					],
					"citations": [
						{
							"id": "",
							"summary": "",
							"start_time": "",
							"duration": 0,
							"callnumber": "",
							"callednumber": "",
							"labels": ""
						}
					],
					"maskName": "",
					"maskCode": "",
					"privateId": ""
				}
			]
		}
	}
}
```


# ai融合接口


## chat_1


**接口地址**:`/combine/chat`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`text/event-stream`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|req||query|true|ChatMsgReq|ChatMsgReq|
|&emsp;&emsp;taskId|||true|string||
|&emsp;&emsp;priId|||false|string||
|&emsp;&emsp;messages|||false|array|ChatMessage|
|&emsp;&emsp;&emsp;&emsp;role|||false|string||
|&emsp;&emsp;&emsp;&emsp;content|||false|string||
|&emsp;&emsp;session_id|||false|string||
|&emsp;&emsp;start_time|||false|string(date-time)||
|&emsp;&emsp;end_time|||false|string(date-time)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ChatResponseVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|session_id||string||
|object||string||
|created||integer(int64)|integer(int64)|
|choices||array|ChatChoice|
|&emsp;&emsp;index||integer(int32)||
|&emsp;&emsp;delta||ChatDelta|ChatDelta|
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;finish_reason||string||
|citations||array|ChatCitation|
|&emsp;&emsp;id|引用标识ID|string||
|&emsp;&emsp;summary|引用的摘要内容|string||
|&emsp;&emsp;start_time|通话开始时间|string(date-time)||
|&emsp;&emsp;duration|通话时长,单位:秒|integer(int32)||
|&emsp;&emsp;callnumber|主叫号码|string||
|&emsp;&emsp;callednumber|被叫号码|string||
|&emsp;&emsp;labels|相关标签,用|分割|string||
|maskName||string||
|maskCode||string||
|privateId||string||


**响应示例**:
```javascript
[
	{
		"session_id": "",
		"object": "",
		"created": 0,
		"choices": [
			{
				"index": 0,
				"delta": {
					"content": ""
				},
				"finish_reason": ""
			}
		],
		"citations": [
			{
				"id": "",
				"summary": "",
				"start_time": "",
				"duration": 0,
				"callnumber": "",
				"callednumber": "",
				"labels": ""
			}
		],
		"maskName": "",
		"maskCode": "",
		"privateId": ""
	}
]
```


## chat_3


**接口地址**:`/combine/chat`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`text/event-stream`


**接口描述**:


**请求示例**:


```javascript
{
  "taskId": "",
  "priId": "",
  "messages": [
    {
      "role": "",
      "content": ""
    }
  ],
  "session_id": "",
  "start_time": "",
  "end_time": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|chatMsgReq|ChatMsgReq|body|true|ChatMsgReq|ChatMsgReq|
|&emsp;&emsp;taskId|||true|string||
|&emsp;&emsp;priId|||false|string||
|&emsp;&emsp;messages|||false|array|ChatMessage|
|&emsp;&emsp;&emsp;&emsp;role|||false|string||
|&emsp;&emsp;&emsp;&emsp;content|||false|string||
|&emsp;&emsp;session_id|||false|string||
|&emsp;&emsp;start_time|||false|string(date-time)||
|&emsp;&emsp;end_time|||false|string(date-time)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ChatResponseVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|session_id||string||
|object||string||
|created||integer(int64)|integer(int64)|
|choices||array|ChatChoice|
|&emsp;&emsp;index||integer(int32)||
|&emsp;&emsp;delta||ChatDelta|ChatDelta|
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;finish_reason||string||
|citations||array|ChatCitation|
|&emsp;&emsp;id|引用标识ID|string||
|&emsp;&emsp;summary|引用的摘要内容|string||
|&emsp;&emsp;start_time|通话开始时间|string(date-time)||
|&emsp;&emsp;duration|通话时长,单位:秒|integer(int32)||
|&emsp;&emsp;callnumber|主叫号码|string||
|&emsp;&emsp;callednumber|被叫号码|string||
|&emsp;&emsp;labels|相关标签,用|分割|string||
|maskName||string||
|maskCode||string||
|privateId||string||


**响应示例**:
```javascript
[
	{
		"session_id": "",
		"object": "",
		"created": 0,
		"choices": [
			{
				"index": 0,
				"delta": {
					"content": ""
				},
				"finish_reason": ""
			}
		],
		"citations": [
			{
				"id": "",
				"summary": "",
				"start_time": "",
				"duration": 0,
				"callnumber": "",
				"callednumber": "",
				"labels": ""
			}
		],
		"maskName": "",
		"maskCode": "",
		"privateId": ""
	}
]
```


## chat_4


**接口地址**:`/combine/chat`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`text/event-stream`


**接口描述**:


**请求示例**:


```javascript
{
  "taskId": "",
  "priId": "",
  "messages": [
    {
      "role": "",
      "content": ""
    }
  ],
  "session_id": "",
  "start_time": "",
  "end_time": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|chatMsgReq|ChatMsgReq|body|true|ChatMsgReq|ChatMsgReq|
|&emsp;&emsp;taskId|||true|string||
|&emsp;&emsp;priId|||false|string||
|&emsp;&emsp;messages|||false|array|ChatMessage|
|&emsp;&emsp;&emsp;&emsp;role|||false|string||
|&emsp;&emsp;&emsp;&emsp;content|||false|string||
|&emsp;&emsp;session_id|||false|string||
|&emsp;&emsp;start_time|||false|string(date-time)||
|&emsp;&emsp;end_time|||false|string(date-time)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ChatResponseVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|session_id||string||
|object||string||
|created||integer(int64)|integer(int64)|
|choices||array|ChatChoice|
|&emsp;&emsp;index||integer(int32)||
|&emsp;&emsp;delta||ChatDelta|ChatDelta|
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;finish_reason||string||
|citations||array|ChatCitation|
|&emsp;&emsp;id|引用标识ID|string||
|&emsp;&emsp;summary|引用的摘要内容|string||
|&emsp;&emsp;start_time|通话开始时间|string(date-time)||
|&emsp;&emsp;duration|通话时长,单位:秒|integer(int32)||
|&emsp;&emsp;callnumber|主叫号码|string||
|&emsp;&emsp;callednumber|被叫号码|string||
|&emsp;&emsp;labels|相关标签,用|分割|string||
|maskName||string||
|maskCode||string||
|privateId||string||


**响应示例**:
```javascript
[
	{
		"session_id": "",
		"object": "",
		"created": 0,
		"choices": [
			{
				"index": 0,
				"delta": {
					"content": ""
				},
				"finish_reason": ""
			}
		],
		"citations": [
			{
				"id": "",
				"summary": "",
				"start_time": "",
				"duration": 0,
				"callnumber": "",
				"callednumber": "",
				"labels": ""
			}
		],
		"maskName": "",
		"maskCode": "",
		"privateId": ""
	}
]
```


## chat_6


**接口地址**:`/combine/chat`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`text/event-stream`


**接口描述**:


**请求示例**:


```javascript
{
  "taskId": "",
  "priId": "",
  "messages": [
    {
      "role": "",
      "content": ""
    }
  ],
  "session_id": "",
  "start_time": "",
  "end_time": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|chatMsgReq|ChatMsgReq|body|true|ChatMsgReq|ChatMsgReq|
|&emsp;&emsp;taskId|||true|string||
|&emsp;&emsp;priId|||false|string||
|&emsp;&emsp;messages|||false|array|ChatMessage|
|&emsp;&emsp;&emsp;&emsp;role|||false|string||
|&emsp;&emsp;&emsp;&emsp;content|||false|string||
|&emsp;&emsp;session_id|||false|string||
|&emsp;&emsp;start_time|||false|string(date-time)||
|&emsp;&emsp;end_time|||false|string(date-time)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ChatResponseVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|session_id||string||
|object||string||
|created||integer(int64)|integer(int64)|
|choices||array|ChatChoice|
|&emsp;&emsp;index||integer(int32)||
|&emsp;&emsp;delta||ChatDelta|ChatDelta|
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;finish_reason||string||
|citations||array|ChatCitation|
|&emsp;&emsp;id|引用标识ID|string||
|&emsp;&emsp;summary|引用的摘要内容|string||
|&emsp;&emsp;start_time|通话开始时间|string(date-time)||
|&emsp;&emsp;duration|通话时长,单位:秒|integer(int32)||
|&emsp;&emsp;callnumber|主叫号码|string||
|&emsp;&emsp;callednumber|被叫号码|string||
|&emsp;&emsp;labels|相关标签,用|分割|string||
|maskName||string||
|maskCode||string||
|privateId||string||


**响应示例**:
```javascript
[
	{
		"session_id": "",
		"object": "",
		"created": 0,
		"choices": [
			{
				"index": 0,
				"delta": {
					"content": ""
				},
				"finish_reason": ""
			}
		],
		"citations": [
			{
				"id": "",
				"summary": "",
				"start_time": "",
				"duration": 0,
				"callnumber": "",
				"callednumber": "",
				"labels": ""
			}
		],
		"maskName": "",
		"maskCode": "",
		"privateId": ""
	}
]
```


## chat_5


**接口地址**:`/combine/chat`


**请求方式**:`PATCH`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`text/event-stream`


**接口描述**:


**请求示例**:


```javascript
{
  "taskId": "",
  "priId": "",
  "messages": [
    {
      "role": "",
      "content": ""
    }
  ],
  "session_id": "",
  "start_time": "",
  "end_time": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|chatMsgReq|ChatMsgReq|body|true|ChatMsgReq|ChatMsgReq|
|&emsp;&emsp;taskId|||true|string||
|&emsp;&emsp;priId|||false|string||
|&emsp;&emsp;messages|||false|array|ChatMessage|
|&emsp;&emsp;&emsp;&emsp;role|||false|string||
|&emsp;&emsp;&emsp;&emsp;content|||false|string||
|&emsp;&emsp;session_id|||false|string||
|&emsp;&emsp;start_time|||false|string(date-time)||
|&emsp;&emsp;end_time|||false|string(date-time)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ChatResponseVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|session_id||string||
|object||string||
|created||integer(int64)|integer(int64)|
|choices||array|ChatChoice|
|&emsp;&emsp;index||integer(int32)||
|&emsp;&emsp;delta||ChatDelta|ChatDelta|
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;finish_reason||string||
|citations||array|ChatCitation|
|&emsp;&emsp;id|引用标识ID|string||
|&emsp;&emsp;summary|引用的摘要内容|string||
|&emsp;&emsp;start_time|通话开始时间|string(date-time)||
|&emsp;&emsp;duration|通话时长,单位:秒|integer(int32)||
|&emsp;&emsp;callnumber|主叫号码|string||
|&emsp;&emsp;callednumber|被叫号码|string||
|&emsp;&emsp;labels|相关标签,用|分割|string||
|maskName||string||
|maskCode||string||
|privateId||string||


**响应示例**:
```javascript
[
	{
		"session_id": "",
		"object": "",
		"created": 0,
		"choices": [
			{
				"index": 0,
				"delta": {
					"content": ""
				},
				"finish_reason": ""
			}
		],
		"citations": [
			{
				"id": "",
				"summary": "",
				"start_time": "",
				"duration": 0,
				"callnumber": "",
				"callednumber": "",
				"labels": ""
			}
		],
		"maskName": "",
		"maskCode": "",
		"privateId": ""
	}
]
```


## chat_7


**接口地址**:`/combine/chat`


**请求方式**:`OPTIONS`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`text/event-stream`


**接口描述**:


**请求示例**:


```javascript
{
  "taskId": "",
  "priId": "",
  "messages": [
    {
      "role": "",
      "content": ""
    }
  ],
  "session_id": "",
  "start_time": "",
  "end_time": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|chatMsgReq|ChatMsgReq|body|true|ChatMsgReq|ChatMsgReq|
|&emsp;&emsp;taskId|||true|string||
|&emsp;&emsp;priId|||false|string||
|&emsp;&emsp;messages|||false|array|ChatMessage|
|&emsp;&emsp;&emsp;&emsp;role|||false|string||
|&emsp;&emsp;&emsp;&emsp;content|||false|string||
|&emsp;&emsp;session_id|||false|string||
|&emsp;&emsp;start_time|||false|string(date-time)||
|&emsp;&emsp;end_time|||false|string(date-time)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ChatResponseVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|session_id||string||
|object||string||
|created||integer(int64)|integer(int64)|
|choices||array|ChatChoice|
|&emsp;&emsp;index||integer(int32)||
|&emsp;&emsp;delta||ChatDelta|ChatDelta|
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;finish_reason||string||
|citations||array|ChatCitation|
|&emsp;&emsp;id|引用标识ID|string||
|&emsp;&emsp;summary|引用的摘要内容|string||
|&emsp;&emsp;start_time|通话开始时间|string(date-time)||
|&emsp;&emsp;duration|通话时长,单位:秒|integer(int32)||
|&emsp;&emsp;callnumber|主叫号码|string||
|&emsp;&emsp;callednumber|被叫号码|string||
|&emsp;&emsp;labels|相关标签,用|分割|string||
|maskName||string||
|maskCode||string||
|privateId||string||


**响应示例**:
```javascript
[
	{
		"session_id": "",
		"object": "",
		"created": 0,
		"choices": [
			{
				"index": 0,
				"delta": {
					"content": ""
				},
				"finish_reason": ""
			}
		],
		"citations": [
			{
				"id": "",
				"summary": "",
				"start_time": "",
				"duration": 0,
				"callnumber": "",
				"callednumber": "",
				"labels": ""
			}
		],
		"maskName": "",
		"maskCode": "",
		"privateId": ""
	}
]
```


## chat_2


**接口地址**:`/combine/chat`


**请求方式**:`HEAD`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`text/event-stream`


**接口描述**:


**请求示例**:


```javascript
{
  "taskId": "",
  "priId": "",
  "messages": [
    {
      "role": "",
      "content": ""
    }
  ],
  "session_id": "",
  "start_time": "",
  "end_time": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|chatMsgReq|ChatMsgReq|body|true|ChatMsgReq|ChatMsgReq|
|&emsp;&emsp;taskId|||true|string||
|&emsp;&emsp;priId|||false|string||
|&emsp;&emsp;messages|||false|array|ChatMessage|
|&emsp;&emsp;&emsp;&emsp;role|||false|string||
|&emsp;&emsp;&emsp;&emsp;content|||false|string||
|&emsp;&emsp;session_id|||false|string||
|&emsp;&emsp;start_time|||false|string(date-time)||
|&emsp;&emsp;end_time|||false|string(date-time)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ChatResponseVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|session_id||string||
|object||string||
|created||integer(int64)|integer(int64)|
|choices||array|ChatChoice|
|&emsp;&emsp;index||integer(int32)||
|&emsp;&emsp;delta||ChatDelta|ChatDelta|
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;finish_reason||string||
|citations||array|ChatCitation|
|&emsp;&emsp;id|引用标识ID|string||
|&emsp;&emsp;summary|引用的摘要内容|string||
|&emsp;&emsp;start_time|通话开始时间|string(date-time)||
|&emsp;&emsp;duration|通话时长,单位:秒|integer(int32)||
|&emsp;&emsp;callnumber|主叫号码|string||
|&emsp;&emsp;callednumber|被叫号码|string||
|&emsp;&emsp;labels|相关标签,用|分割|string||
|maskName||string||
|maskCode||string||
|privateId||string||


**响应示例**:
```javascript
[
	{
		"session_id": "",
		"object": "",
		"created": 0,
		"choices": [
			{
				"index": 0,
				"delta": {
					"content": ""
				},
				"finish_reason": ""
			}
		],
		"citations": [
			{
				"id": "",
				"summary": "",
				"start_time": "",
				"duration": 0,
				"callnumber": "",
				"callednumber": "",
				"labels": ""
			}
		],
		"maskName": "",
		"maskCode": "",
		"privateId": ""
	}
]
```