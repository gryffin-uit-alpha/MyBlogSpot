package model

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
	Meta    *MetaInfo   `json:"meta,omitempty"`
}

type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type MetaInfo struct {
	Page       int  `json:"page"`
	PerPage    int  `json:"per_page"`
	Total      int  `json:"total"`
	TotalPages int  `json:"total_pages"`
	HasNext    bool `json:"has_next"`
	HasPrev    bool `json:"has_prev"`
}

func SuccessResponse(data interface{}) Response {
	return Response{Success: true, Data: data}
}

func SuccessResponseWithMeta(data interface{}, meta *MetaInfo) Response {
	return Response{Success: true, Data: data, Meta: meta}
}

func ErrorResponse(code, message string) Response {
	return Response{
		Success: false,
		Error:   &ErrorInfo{Code: code, Message: message},
	}
}
