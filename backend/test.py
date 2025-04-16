import pandas as pd
import app

df = pd.read_csv('./data/courses_2025_spring_cleaned.csv')

print(app.filter_courses(df, subject = 'CS', class_type = 'Lecture', day = 'F'))